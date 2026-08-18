' ============================================================================
' hidden_task.vbs — THE SCHEDULED-ORGAN CLOAK (11 Aug 2026, HIS ruling)
'
' WHY THIS EXISTS, AND WHY IT IS NOT hidden_run.vbs.
' The captain's own words, 11 Aug 2026: "my terminal keeps popping up and then
' closing a lot of times which is very distracting for me ... it is very
' distracting for my adhd brain." He is right, and it was measurable: ~25 live
' ArsenalFC-* tasks ran as `cmd /c ...`, which Task Scheduler launches with a
' VISIBLE console in his session. Throwin every 15 min, BrainTick + Touchline +
' Wall-Live every 30, Presence, CapturePull hourly — a window flashing across
' his screen roughly every seven minutes, all day, while he studies.
'
' hidden_run.vbs already solved "no window" for the DAEMONS — but it ends in
'   sh.Run cmd, 0, False        ' fire-and-forget
' which is correct for something that must outlive its launcher, and WRONG for a
' scheduled organ: the task exits the instant the VBS returns, always with code
' 0, so Task Scheduler's `Last Result` becomes a lie. /organism-doctor and
' watchman.mjs both read Last Result to decide whether an organ is alive, so
' cloaking the scheduled rows with hidden_run.vbs would have hidden the windows
' AND blinded every health check in the same move — trading a distraction for a
' silent organism. That is the exact trade run_logged.cmd's header warns about
' ("THIS MUST NOT BREAK: 1. THE EXIT CODE").
'
' So this cloak WAITS (bWaitOnReturn = True) and QUITS WITH THE CHILD'S CODE.
' Window style stays 0 — nothing is ever drawn.
'
'   usage:  wscript hidden_task.vbs cmd /c <repo>\setup\run_logged.cmd scripts\viz.mjs
'           wscript hidden_task.vbs cmd /c node <repo>\scripts\x.mjs >> <log> 2>&1
'
' LOGGING is deliberately NOT done here: every command this wraps already ends
' in run_logged.cmd or its own `>>` redirect, and a second layer of redirect
' would fight the first. This file does exactly one thing — it takes away the
' window and gives back the exit code.
'
' NOTE on argument handling: wscript's own host switches are DOUBLE-slashed
' (//B //T:nn), so a single `/c` passes straight through to the script as an
' argument. WScript.Arguments strips one layer of quoting, so any argument that
' still contains a space is re-quoted below before the line is reassembled.
' ============================================================================

Set sh = CreateObject("Wscript.Shell")
repoDir = "C:\Users\nikhi\GitHub\arsenal-ai-fc"

If WScript.Arguments.Count = 0 Then
  WScript.Quit 2                       ' nothing to run is a fault, not a success
End If

cmd = ""
For i = 0 To WScript.Arguments.Count - 1
  a = WScript.Arguments(i)
  If InStr(a, " ") > 0 And Left(a, 1) <> """" Then a = """" & a & """"
  If cmd = "" Then cmd = a Else cmd = cmd & " " & a
Next

On Error Resume Next
sh.CurrentDirectory = repoDir
On Error Goto 0

' OVERHAUL Block 6 (18 Aug 2026) — THE DAY-KEY LAW's marker. Every SCHEDULED row
' runs through THIS cloak and no daemon does (hidden_run.vbs is theirs), so the
' one honest place to say "Task Scheduler launched me" is here. The child (cmd →
' run_logged.cmd → node) inherits it; scripts/daykey.mjs then keys the organ's
' day to ITS SLOT when the run is a catch-up burst (laptop woke, slot long gone),
' and to the clock on time. A hand run never carries it — hand runs stay clock.
sh.Environment("PROCESS")("ARSENAL_SCHEDULED") = "1"

' 0 = no window, ever.  True = wait, so the code below is the ORGAN's own.
rc = sh.Run(cmd, 0, True)
WScript.Quit rc
