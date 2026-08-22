Set-Location -Path $PSScriptRoot

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Starting ProjectVault PLMS..." -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan

if (-not (Test-Path -Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Start-Process "http://localhost:5173/"
npm run dev
