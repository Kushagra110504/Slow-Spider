@echo off
title Slow Spider
cd /d "%~dp0"

echo ===================================================
echo   Starting Slow Spider...
echo ===================================================
echo.

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Opening Slow Spider in your default browser...
start http://localhost:5173/

echo Starting local development server...
call npm run dev
