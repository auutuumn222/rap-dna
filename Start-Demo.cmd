@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 20 or later to run this Demo.
  pause
  exit /b 1
)
echo Starting RAP DNA. Keep this window open while using the Demo.
node server.mjs --open
pause
