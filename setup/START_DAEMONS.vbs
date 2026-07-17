' ============================================================================
' START_DAEMONS.vbs - reboot persistence for the organism's background brain.
' A copy of this lives in the user's Startup folder, so on EVERY logon it
' silently (re)starts the three always-on daemons. Each is a singleton via a
' localhost port lock (:4111 turnstile, :4112 cortex, :4113 thalamus), so if the
' daily scheduled task already started one, this second start just stands down.
' Fixes the 18-Jul finding: the daemons had a DAILY trigger only, so a mid-day
' reboot left the deep brain (cortex) and capture (turnstile) dead until the
' next day. The Dugout (:4114) is NOT started here - it starts when he opens
' THE GAFFER (its launcher does kill-then-start so it always serves fresh code).
' ============================================================================
Dim sh, repo
Set sh = CreateObject("WScript.Shell")
repo = "C:\Users\nikhi\GitHub\arsenal-ai-fc"
sh.CurrentDirectory = repo
' window style 0 = hidden, False = don't wait; the daemons run forever
sh.Run "cmd /c node scripts\thalamus.mjs", 0, False
sh.Run "cmd /c node scripts\cortex.mjs", 0, False
sh.Run "cmd /c node scripts\turnstile.mjs", 0, False
