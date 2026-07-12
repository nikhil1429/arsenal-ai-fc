# NTFY_SETUP.md — the throw-in (fifth verb) + the morning push

## Part 1 — the SECRET topic (2 min)
The topic name IS the password. Make it long and random; never share it, never
commit it.

1. Generate a topic name (PowerShell):
   ```powershell
   -join ((48..57)+(97..122) | Get-Random -Count 40 | % {[char]$_})
   ```
2. Save it where only the organism reads it (gitignored):
   ```powershell
   Set-Content -Encoding ascii dressing-room\state\throwin_topic.txt "<paste-topic-here>"
   ```
3. Verify: `node scripts\throwin.mjs` should say `0 ball(s) landed` (wired, not dormant).

**Honesty note:** a random 40-char topic on free ntfy.sh is security-by-
obscurity — strong in practice, but true access-control (reserved topics) is
ntfy Pro = money → it is on the money-gate list for you and Nidhi. Until then:
long random topic, rotate it if ever leaked.

## Part 2 — the phone (3 min)
1. Install the **ntfy** app (Android/iOS, free).
2. Subscribe to your topic (exact string from step 1).
3. **The throw-in reflex** — one-tap dictation:
   - Android: home-screen widget → your topic → keyboard-mic → speak → send.
   - Even faster: a Quick-tile / shortcut that shares to ntfy.
4. Test: send "test throw-in" from the phone; within 15 min (or run
   `node scripts\throwin.mjs`) it lands verbatim in `loose_balls.jsonl`.
   Tonight's post-match will show it for routing.

The organism NEVER counts or coaches your throw-in usage. It is a reflex, not
a duty. The Physio only watches for *delivery* failure (poller wired but dead).

## Part 3 — the morning sheet push (1 min, optional)
Edit `dressing-room/state/brain_config.json` → `"ntfy": { "enabled": true,
"topic": "<same-or-a-second-topic>" }`. Only the 08:45 sheet pushes. Nothing
else ever pings — that is constitutional.
