' hidden_run.vbs — runs a command with NO window at all (the daemons' cloak).
' A visible console begs to be closed; closing it kills the daemon (scar:
' 0xC000013A on 14 Jul 2026). Usage: wscript hidden_run.vbs node scripts\thalamus.mjs
'
' 2 Aug 2026 audit, finding #10 — THE CLOAK WAS ALSO A GAG.
' This used to end in `sh.Run cmd, 0, False` with no redirect, so stdout AND stderr
' went to a closed handle for every organ running under it (Thalamus, Cortex,
' BrainDaemon, Turnstile). Everything those daemons tried to say was discarded:
'   · thalamus.mjs:540's moment-loss reason — added by a PRIOR audit precisely
'     because a lost moment had no log
'   · the whisper / pre-answer attach flags, which is why "has the pre-answer
'     engine ever fired?" was unanswerable and had to be reconstructed from ledgers
'   · the WAKE line, and the reason the organism's first-ever spontaneous
'     doubt-wake (18 Jul) was closed as "gave-up-after-2-attempts" with no record
'     of why — 1 of only 2 wakes in the organism's life, unexplainable
'   · and, worst, any CRASH BEFORE JS STARTS (a syntax error, a bad import, a
'     missing module) — which no in-process JS logger can ever catch.
' ArsenalFC-Goalkeeper already redirected under this same cloak, so the pattern was
' proven on this box; these four just never got it.
'
' Each command gets its OWN log, named from the script it runs, under scripts\.
' The log is rolled at ~2 MB so the cloak cannot become a disk leak (the audit's
' finding #51 is the same class of bug on presence_log.jsonl).

Const MAX_LOG_BYTES = 2097152        ' 2 MB, then roll to .1 (one generation kept)

Set sh = CreateObject("Wscript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

repoDir = "C:\Users\nikhi\GitHub\arsenal-ai-fc"

' --- rebuild the command line exactly as before -----------------------------
cmd = ""
scriptArg = ""
For i = 0 To WScript.Arguments.Count - 1
  a = WScript.Arguments(i)
  cmd = cmd & a & " "
  ' remember the first argument that looks like a script path — that names the log
  If scriptArg = "" And InStr(LCase(a), ".mjs") > 0 Then scriptArg = a
Next

' --- derive the log name from the script being run --------------------------
If scriptArg = "" Then
  logName = "daemon"
Else
  logName = fso.GetBaseName(scriptArg)      ' "scripts\thalamus.mjs" -> "thalamus"
End If
logFile = repoDir & "\scripts\" & logName & ".log"
' NOTE: *.log is already gitignored (repo is PUBLIC and these carry his words).

' --- roll the log if it has grown past the cap ------------------------------
On Error Resume Next
If fso.FileExists(logFile) Then
  If fso.GetFile(logFile).Size > MAX_LOG_BYTES Then
    If fso.FileExists(logFile & ".1") Then fso.DeleteFile logFile & ".1", True
    fso.MoveFile logFile, logFile & ".1"
  End If
End If
On Error Goto 0

' --- run it, still with NO window, but now with a voice ---------------------
' The redirect requires a shell, so the command goes through `cmd /c`. Window
' style stays 0 (invisible) and bWaitOnReturn stays False (fire-and-forget), so
' the daemon's lifetime and the no-window guarantee are both unchanged.
sh.CurrentDirectory = repoDir
sh.Run "cmd /c " & cmd & " >> """ & logFile & """ 2>&1", 0, False
