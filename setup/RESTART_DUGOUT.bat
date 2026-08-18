@echo off
REM RESTART_DUGOUT.bat - 18 Aug 2026. ONE double-click: restarts the Dugout bridge on the current
REM code (mouth contract - the sitting opens itself - FIRST TURN law) and opens the page. If the old
REM bridge is elevated it asks once for Administrator (UAC -> Yes). Nothing to remember.
powershell -ExecutionPolicy Bypass -File "%~dp0open_dugout.ps1"
