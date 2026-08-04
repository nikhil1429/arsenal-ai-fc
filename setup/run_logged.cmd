@echo off
REM ============================================================================
REM run_logged.cmd - run one organ, keep what it says, and keep its exit code.
REM ----------------------------------------------------------------------------
REM 2 Aug 2026 audit, finding #98 (cohort half).
REM INSTALL_TASKS.ps1's Mk() built every task as a bare
REM     cmd /c cd /d <repo> ^&^& node scripts\<organ>.mjs
REM with NO redirect, so ~35 scheduled organs spoke into a cmd window that closed
REM the instant they finished. When the Boot Room woke on Sunday and honestly had
REM nothing to propose, that sentence went nowhere - and "did the genome run?"
REM became unanswerable, while /organism-doctor read Last Result 0 and called it
REM green. A handful of organs (Goalkeeper, FSRS, Calibration, Nemesis,
REM LearningState, TimeAuditor) already had a hand-appended redirect; this makes
REM it the default for every organ instead of a privilege of six.
REM
REM   usage:  run_logged.cmd scripts\viz.mjs [args...]
REM   log:    <repo>\scripts\<script-basename>.log     (*.log is gitignored)
REM
REM TWO THINGS THIS MUST NOT BREAK, both learned the hard way:
REM   1. THE EXIT CODE. Task Scheduler's Last Result is what /organism-doctor
REM      reads to decide whether an organ is alive, so this wrapper must exit with
REM      the ORGAN's code, never its own. The exit /b below does that.
REM   2. DISK. An append-forever log is the same defect as finding #51
REM      (presence_log.jsonl, unbounded, ~6.7 MB/yr). Rolled at 2 MB, one
REM      generation kept via move /y (which overwrites, so no delete is needed).
REM
REM NOTE: this file MUST stay CRLF + ASCII. A .cmd saved with LF-only endings has
REM cmd.exe eating the first character of every line ("REM" parses as "M").
REM ============================================================================
setlocal
set "REPO=%~dp0.."
cd /d "%REPO%" || exit /b 1

REM %~n1 = basename of the first arg: "scripts\viz.mjs" -> "viz"
set "LOGNAME=%~n1"
if "%LOGNAME%"=="" set "LOGNAME=organ"
set "LOG=%REPO%\scripts\%LOGNAME%.log"

REM --- roll at 2 MB, keep one generation (move /y overwrites the old .1) ---
if exist "%LOG%" (
  for %%F in ("%LOG%") do (
    if %%~zF GTR 2097152 move /y "%LOG%" "%LOG%.1" >nul 2>&1
  )
)

REM --- stamp the run, so even a silent organ leaves evidence it woke ---
echo.>> "%LOG%"
echo == %DATE% %TIME% :: node %* >> "%LOG%"

node %* >> "%LOG%" 2>&1
exit /b %ERRORLEVEL%