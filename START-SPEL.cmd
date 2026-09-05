@echo off
title KosterBro's - The Birthday Quest
cd /d "%~dp0"
node scripts/start-local.mjs
if errorlevel 1 pause
