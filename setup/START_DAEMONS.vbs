' ============================================================================
' START_DAEMONS.vbs - manual daemon (re)start for the organism's background brain.
' STATUS (9 Aug 2026, launch audit): the Startup-folder copy of this file was
' SUPERSEDED by ArsenalFC-Brain.bat (audit #108) - the .bat is the live logon
' persistence and also starts the brain pacemaker; the old Startup copy is
' parked as ArsenalFC-Daemons.vbs.superseded-audit108. This file remains the
' MANUAL restart verb ("wscript setup\START_DAEMONS.vbs" - the watchman's
' daemon-down evidence line points here), so it must behave exactly like the
' .bat: every organ through hidden_run.vbs, because the bare `cmd /c node`
' form is a GAG (finding #10 - stdout AND stderr die on a closed handle).
' Until 9 Aug this file still used the bare form AND its header claimed the
' Startup copy was alive - both false; both fixed here.
' Singletons via port locks (:4111 turnstile, :4112 cortex, :4113 thalamus,
' :4116 brain pacer, :4117 sitting), so a double start harmlessly stands down.
' The Dugout (:4114) is NOT started here - its launcher kill-then-starts.
' ============================================================================
Dim sh, repo
Set sh = CreateObject("WScript.Shell")
repo = "C:\Users\nikhi\GitHub\arsenal-ai-fc"
sh.CurrentDirectory = repo
sh.Run "wscript.exe """ & repo & "\setup\hidden_run.vbs"" node scripts\thalamus.mjs", 0, False
WScript.Sleep 3000
sh.Run "wscript.exe """ & repo & "\setup\hidden_run.vbs"" node scripts\cortex.mjs", 0, False
WScript.Sleep 2000
sh.Run "wscript.exe """ & repo & "\setup\hidden_run.vbs"" node scripts\turnstile.mjs", 0, False
WScript.Sleep 2000
sh.Run "wscript.exe """ & repo & "\setup\hidden_run.vbs"" node scripts\brain.mjs daemon", 0, False
WScript.Sleep 2000
' BLOCK 3 (18 Aug 2026): THE SITTING BRAIN — the resident mind behind every mouth (:4117; sitting.mjs daemon).
sh.Run "wscript.exe """ & repo & "\setup\hidden_run.vbs"" node scripts\sitting.mjs daemon", 0, False
WScript.Sleep 2000
' D7 (9 Aug 2026): the context bridge is the 5th resident daemon (context.mjs #22).
sh.Run "wscript.exe """ & repo & "\setup\hidden_run.vbs"" node scripts\context.mjs daemon", 0, False
