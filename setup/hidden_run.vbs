' hidden_run.vbs — runs a command with NO window at all (the daemons' cloak).
' A visible console begs to be closed; closing it kills the daemon (scar:
' 0xC000013A on 14 Jul 2026). Usage: wscript hidden_run.vbs node scripts\thalamus.mjs
Set sh = CreateObject("Wscript.Shell")
cmd = ""
For i = 0 To WScript.Arguments.Count - 1
  cmd = cmd & WScript.Arguments(i) & " "
Next
sh.CurrentDirectory = "C:\Users\nikhi\GitHub\arsenal-ai-fc"
sh.Run cmd, 0, False
