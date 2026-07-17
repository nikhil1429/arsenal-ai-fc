@echo off
title LIGHTEN THE MACHINE - Arsenal AI FC
cd /d "%~dp0"

rem Already admin? Then run. Otherwise re-launch THIS file elevated.
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Asking Windows for administrator rights - approve the blue UAC popup...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo.
echo  ============================================
echo   LIGHTEN THE MACHINE  -  running as admin
echo  ============================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0LIGHTEN_THE_MACHINE.ps1"

echo.
echo  If anything above looks wrong, the full log is:
echo    %~dp0LIGHTEN_last_run.log
echo.
pause
