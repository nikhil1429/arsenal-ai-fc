@echo off
rem Regenerates the whole-repo bundle (fresh from current files) then opens it.
cd /d C:\Users\nikhi\GitHub\arsenal-ai-fc
node scripts\repo_bundle.mjs
start "" "C:\Users\nikhi\GitHub\arsenal-ai-fc\ARSENAL_FC_FULL_REPO_BUNDLE.md"
