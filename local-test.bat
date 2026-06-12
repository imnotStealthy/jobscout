@echo off
setlocal

cd /d "%~dp0"

echo Running npm run build...
call npm run build
if errorlevel 1 (
  echo Build failed. npm run dev was not started.
  exit /b %errorlevel%
)

echo Starting npm run dev...
call npm run dev
exit /b %errorlevel%
