@echo off
setlocal

cd /d "%~dp0"

echo Running initial build...
call npm run build
if errorlevel 1 (
  echo Build failed. Bot was not started.
  exit /b %errorlevel%
)

:restart
echo Starting bot in dev mode...
call npm run dev
set EXIT_CODE=%errorlevel%

echo Bot stopped with exit code %EXIT_CODE%.
echo Restarting in 5 seconds. Press Ctrl+C to stop.
timeout /t 5 /nobreak >nul
goto restart
