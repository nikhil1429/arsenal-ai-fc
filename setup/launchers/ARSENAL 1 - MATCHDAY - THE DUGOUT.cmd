@echo off
title THE DUGOUT
rem kill-then-start via open_dugout.ps1 — a stale bridge on :4114 is killed
rem FIRST so this icon ALWAYS serves current code; the bridge runs hidden and
rem the page opens itself. (Direct `node scripts\dugout.mjs` stood down on
rem EADDRINUSE and silently left OLD code serving — audit fix 15.)
powershell -ExecutionPolicy Bypass -File "C:\Users\nikhi\GitHub\arsenal-ai-fc\setup\open_dugout.ps1"
