$ErrorActionPreference = "Stop"
Set-Location "D:\VScodefiles\XYZW\xyzw_web_helper"

if (-not (Test-Path "node_modules\vite\bin\vite.js")) {
    Write-Host "vite not found, installing dependencies..."
    pnpm install
}

Write-Host "Starting XYZW dev server on port 3000..."
& node "node_modules\vite\bin\vite.js" --host
