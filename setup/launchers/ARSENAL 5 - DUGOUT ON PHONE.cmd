@echo off
title THE DUGOUT (LAN) - leave this window open; the phone address is below
cd /d C:\Users\nikhi\GitHub\arsenal-ai-fc
echo Home-wifi only. Open the printed address in the phone's Chrome.
echo (One-time phone mic unlock: see setup\VOICE_SETUP.md, section LAN)
node scripts\dugout.mjs --lan
pause
