@echo off
title LIGHTEN THE MACHINE - Arsenal AI FC
set "SCRIPT=C:\Users\nikhi\GitHub\arsenal-ai-fc\setup\LIGHTEN_THE_MACHINE.ps1"

rem Already admin? Run it. Otherwise re-launch THIS file elevated (blue UAC popup).
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
if not exist "%SCRIPT%" (
  echo  ERROR: cannot find %SCRIPT%
  pause
  exit /b
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"

echo.
echo  Full log: C:\Users\nikhi\GitHub\arsenal-ai-fc\setup\LIGHTEN_last_run.log
echo.
pause
