@echo off
title SCRIMMAGE - you asked to be judged
cd /d C:\Users\nikhi\GitHub\arsenal-ai-fc
powershell -NoProfile -Command "if (-not (Get-NetTCPConnection -LocalPort 4114 -State Listen -ErrorAction SilentlyContinue)) { Start-Process -WindowStyle Minimized cmd -ArgumentList '/c title THE DUGOUT bridge && cd /d C:\Users\nikhi\GitHub\arsenal-ai-fc && set DUGOUT_NO_OPEN=1&& node scripts\dugout.mjs'; Start-Sleep -Seconds 4 }"
start "" "http://localhost:4114/?mode=scrimmage"
