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

> **VERIFIED 10 Aug 2026 — this claim held.** The owner is `viz.mjs`: its
> `promptPack()` builds `voice_brief.md` from `voiceBrief(data)`, and
> `renderWall` writes *every* pack entry into `CLUB_DIR/prompts/` on each
> render — so "fresh at every wall render" is literally true, not aspirational.
> Check it live rather than trusting this line:
> `grep -n "voice_brief.md\|for (const \[name, text\] of Object.entries(pack))" scripts/viz.mjs`
> and `grep -n "CLUB_DIR  *=" scripts/viz.mjs` (it resolves to
> `dressing-room/club`). The brief is spoken-register by construction — its own
> closing line hands the Gem the same laws the Gem prompt above carries
> (`grep -n "Rules for this conversation" scripts/viz.mjs`).

## Lane 2 — HANDS-FREE CLAUDE (already works, nothing to install)
In this repo, press **Win+H** (Windows voice typing) inside any Claude Code
session and speak: "matchday" · "rematch" · "full time" — the skills run by
voice. Your rituals are now speakable.

> **VERIFIED 10 Aug 2026:** all three named skills exist — `matchday`,
> `rematch`, `full-time` are directories under `.claude/skills/`. Never trust a
> skill *count* written into prose (it rots on the next skill added); count and
> name them live: `ls .claude/skills/`. Win+H itself is a Windows OS feature,
> outside this repo — nothing here can confirm or break it.

## Lane 3 — THE ORGANISM SPEAKS ALOUD (optional, offline, free)
> **DELETED (LADDER E6, 9 Aug 2026):** `SPEAK.ps1` was removed from the repo —
> audit #55 had already named it an orphaned pre-neural duplicate, and nothing
> scheduled or imported it. The section below is kept as history only.
> *(corrected 10 Aug 2026: this cited `speak.mjs:19` — a bare line number, which
> is exactly the citation form that drifts in this repo. The string is still
> there but the line will move; grep it instead:*
> `grep -n "ORPHANED PRE-NEURAL DUPLICATE" scripts/speak.mjs`*. Deletion itself
> re-confirmed today: `ls setup/` shows no `SPEAK.ps1`, `git ls-files | grep -i speak`
> returns only `scripts/speak.mjs`, and the removing commit is* `8b8eb34`
> *— `git log --diff-filter=D -- setup/SPEAK.ps1`, dated 2026-08-09 22:51 +0530,
> whose message says "SPEAK.ps1 and the SelfKnowledge row are deleted per his
> freeze".)*

> **THE LIVE ALOUD-VOICE IS `speak.mjs`, NOT THIS SECTION** (added 10 Aug 2026 —
> the heading "THE ORGANISM SPEAKS ALOUD" sat on top of nothing but a deleted
> script, so a reader could conclude the organism has no working spoken voice.
> It has one). `node scripts/speak.mjs "<line>"` speaks through Edge neural TTS
> (`en-US-ChristopherNeural`), falling back to Windows System.Speech offline;
> `--to-file <path.mp3>` synthesises without playback. Its real callers are
> named in its own header — grep them, don't trust a list written here:
> `grep -n "WHO ACTUALLY CALLS IT" -A 10 scripts/speak.mjs`. Confirmed live
> today: `talk.mjs` imports `say` and awaits it three times, `turnstile.mjs`
> dynamic-imports `say` on capture success/failure, `dugout.mjs` uses `say` in
> `fireReminders` and `synthToFile` for ACK fillers, and
> `.claude/skills/talk/SKILL.md` shells the script directly. Bias-to-silence
> still holds: **no scheduled task makes the laptop talk out loud** — the
> nightly half is `synthToFile` (mp3s to `club/media/`), which is silent.

`setup/SPEAK.ps1` (now deleted) read the team sheet's first eight lines out loud
through Windows TTS. Enable only if a talking laptop suits your room:

> *(corrected 10 Aug 2026 — three facts in the sentence above were wrong, all
> checkable against the deleted file itself:* `git show 8b8eb34^:setup/SPEAK.ps1`*.*
> *(1) It read "the morning sheet's opening lines" — precisely* `Get-Content $sheet -TotalCount 8`*,
> i.e. the first EIGHT lines, from* `dressing-room\state\team_sheet.md` *(an
> absolute hardcoded path, not `dressing-room/club/`).*
> *(2) "at 08:46" was never in the script. 08:46 exists only in the `schtasks`
> command printed below — a command this file itself records as never run, so
> the script had no time of its own at all.*
> *(3) "its only other utterance: the 21:30 bell line" — the script branched on*
> `$hour -ge 20`*, any hour from 20:00 onward, and 21:30 appears nowhere in it.
> The organism's actual full-time bell is a separate task,* `ArsenalFC-Bell-FullTime`
> *(`grep -n "Bell-FullTime" setup/INSTALL_EVENING_CONDUCTOR.ps1`), which is a
> different lane entirely and is currently **Disabled** in the live schedule —
> read that state live, never from prose:* `schtasks /Query /FO CSV /NH`*.)*

> ⚠️ **DEAD — THE COMMAND BELOW CANNOT WORK AT ALL. Do not run it.**
> *(escalated 10 Aug 2026: this said "SUPERSEDED … DO NOT RUN AS-IS" and argued
> it was a **footgun**, which was true on 6 Aug when the file still existed.
> Since* `8b8eb34` *(9 Aug 2026) it is stronger than a footgun and weaker than a
> lane: `setup/SPEAK.ps1` **does not exist**. The command below would register a
> daily task pointing at a missing file, so it would fail silently every morning
> at 08:46 and leave a permanently-erroring row in the schedule that the
> watchman's `tasks_expected.json` diff would then have to explain. Verify the
> absence, don't take this line's word:* `ls setup/`*.)*
>
> The block is kept, not deleted (layering law). The original reasons still
> stand as history and are still the reason nobody should revive it as-is:
> `SPEAK.ps1` was an **orphaned pre-neural duplicate** (audit #55). It called
> Windows `System.Speech` directly, so it never touched `speak.mjs` and
> **bypassed the neural voice** (`en-US-ChristopherNeural`) entirely — the
> robotic fallback became the only voice. And it read `team_sheet.md`, which
> **still opens with the cold-start line today**: installing it as-is would
> robot-voice that sentence at you every morning.
> *(corrected 10 Aug 2026: two rot-prone citations replaced. `scripts/speak.mjs:18-28`
> had already drifted — the block it names now sits at 19–29; grep it instead:*
> `grep -n "NOT A LANE" -A 11 scripts/speak.mjs`*. And the quoted sheet sentence
> was hardcoded here; a sheet is rewritten every morning, so read it live:*
> `grep -n "I don't know you yet" dressing-room/state/team_sheet.md` *— which
> did still hit on 10 Aug 2026, on the `2026-08-10 · Matchday 1 · Introduction`
> sheet. When the Gaffer finally knows him, that grep goes quiet and this
> paragraph's premise expires with it.)*
>
> There is deliberately **no `ArsenalFC-Speak` task installed** — re-confirmed
> live on 10 Aug 2026: `schtasks /Query /FO CSV /NH` lists dozens of
> `ArsenalFC-*` rows and no `ArsenalFC-Speak` among them, and the schedule's own
> declared shape records the omission on purpose (`grep -n "ArsenalFC-Speak"
> dressing-room/state/tasks_expected.json` → *"the pre-neural voice lane
> VOICE_SETUP.md never installed; SPEAK.ps1 itself was deleted (LADDER E6)"*).
> *(corrected 10 Aug 2026: this used to end "this lane stays uninstalled until
> `SPEAK.ps1` is rewritten to shell `node scripts/speak.mjs "<line>"`" — you
> cannot rewrite a file that is gone. Reviving this lane now means **writing a
> new script from scratch** that shells `node scripts/speak.mjs "<line>"`, and
> that is a build decision for the captain, not a setup step.)*
> Until then, Lane 1 and Lane 3-via-`speak.mjs` are the real voices.

```powershell
# HISTORY ONLY — this file no longer exists. Running this registers a broken task.
schtasks /Create /F /TN "ArsenalFC-Speak" /TR "powershell -ExecutionPolicy Bypass -File C:\Users\nikhi\GitHub\arsenal-ai-fc\setup\SPEAK.ps1" /SC DAILY /ST 08:46
```
Bias-to-silence law: it speaks the two sanctioned utterances only — never
anything else, never mid-day.

> *(corrected 10 Aug 2026 — nearly true, and the gap matters if this lane is ever
> rebuilt. `SPEAK.ps1` had **three** speech branches, not two: the full-time line
> (`$hour -ge 20`), the sheet read (sheet present), and a third `else` fallback —
> "No sheet on the wall yet, captain." — for a morning with no sheet on disk. Two
> were sanctioned; the third was an unannounced failure-mode utterance, which is
> exactly the kind of line a bias-to-silence law is supposed to forbid. And
> "never mid-day" was never a property of the script — it had no schedule of its
> own (see (2) above); silence at noon came only from the proposed 08:46 task, so
> the guarantee lived in the scheduler, not in the code. Evidence:*
> `git show 8b8eb34^:setup/SPEAK.ps1`*.)*
>
> **The law itself is alive and now lives in code, not prose.** `speak.mjs` holds
> it as a stated law — grep it: `grep -n "Bias-to-silence" scripts/speak.mjs` —
> and it is currently satisfied by construction: every caller of `say()` is human-
> or daemon-triggered, and the only nightly half is the silent `synthToFile`.

## LAN — the Dugout on your phone (U4)
Start the bridge with the flag, on your home wifi only:
```
node scripts/dugout.mjs --lan
```
(`npm run dugout:lan` is the same command — verified 10 Aug 2026,
`grep -n "dugout:lan" package.json`.)

It prints a LAN link that **carries a one-run key**, e.g.
`http://192.168.1.7:4114/?k=<32-hex>`. Open **that whole link, key and all** in
the phone's Chrome — the first page-load sets a `dugout_k` cookie so every later
fetch on that origin is authorised. **One-time mic unlock** (phone browsers block
the mic on plain http): open `chrome://flags/#unsafely-treat-insecure-origin-as-secure`,
add exactly `http://<that-ip>:4114`, relaunch Chrome, then START TALKING.
Honest note: that flag lowers one browser guardrail for that one address on
your own wifi — remove it any time. Localhost (no flag) stays the default.

> **corrected 10 Aug 2026 — this was the one line in the file that would have
> made you do the wrong thing.** It said *"It prints your laptop's LAN address
> (e.g. `http://192.168.1.7:4114`). Open that in the phone's Chrome."* Typing
> that bare address into the phone now returns **401**, and the page you get is
> the bench's own refusal — *"this is the captain's bench. Open the link printed
> in the terminal (it carries the one-run key)."* You would reasonably conclude
> the bridge was broken. The doc's instruction predates the E2E audit of 25 Jul
> 2026, which closed a real hole: in `--lan` mode every route was unauthenticated
> while `GET /config` handed back the whole raw Gemini key pool and `POST /tool`
> executed state-mutating owner scripts, so anything on the wifi could take the
> keys and drive the bus. Live evidence in `scripts/dugout.mjs` — grep, don't
> trust line numbers here:
> `grep -n "THE LAN DOOR\|LAN_KEY\|captain's bench\|ONE-RUN key" scripts/dugout.mjs`.
> Three facts that follow from the code and that this section never said:
> **a new key is minted on every start**, so yesterday's link is dead;
> **loopback is exempt** (`allowed = !lanMode || isLoopback(req) || hasKey(req)`),
> which is why plain `npm run dugout` is unchanged; and the terminal itself
> prints both the keyed link and the `chrome://flags` hint, so the terminal —
> not this file — is the authority on the exact address.
>
> **VERIFIED, unchanged:** the port really is `4114` ("the captain's number" —
> `grep -n "const PORT" scripts/dugout.mjs`); localhost really is the default
> (`server.listen(PORT, lan ? "0.0.0.0" : "127.0.0.1")`); and the mic-flag
> instruction matches what the bridge prints for itself. One nuance the code
> knows and this section did not: the in-page error for a bare-IP visit says the
> mic *"only opens on http://localhost:4114 exactly (not an IP)"* until that
> Chrome flag is added — the flag is what makes the IP count as a secure origin,
> so **do the flag step before blaming the mic**
> (`grep -n "INSECURE CONTEXT" scripts/dugout.mjs`).

## What stays gated (honest)
Always-listening ambient voice (wake-word, room mic) = new hardware/services
and a privacy surface — money-gate + a you-and-Nidhi decision, not a build.
