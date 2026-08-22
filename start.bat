@echo off
title ProjectVault PLMS
cd /d "%~dp0"

echo ===================================================
echo   Starting ProjectVault PLMS...
echo ===================================================
echo.

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo Opening ProjectVault in your default browser...
start http://localhost:5173/

echo Starting local development server...
call npm run dev
