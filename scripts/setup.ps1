# SnapFind AI — Environment Setup Script (Windows PowerShell)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   SnapFind AI — Local Setup Script     " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Environment variable check
if (-not (Test-Path ".env")) {
    Write-Host "[1/3] Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
} else {
    Write-Host "[1/3] .env already exists." -ForegroundColor Green
}

# 2. Install root and workspace npm dependencies
Write-Host "[2/3] Installing frontend dependencies via npm workspaces..." -ForegroundColor Yellow
npm install

# 3. Setup Python virtual environment
Write-Host "[3/3] Setting up Python backend virtual environment..." -ForegroundColor Yellow
Set-Location "services\backend"
if (-not (Test-Path ".venv")) {
    python -m venv .venv
}
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Set-Location "..\.."

Write-Host "`nSetup complete! You can now run:" -ForegroundColor Green
Write-Host "  npm run dev:website  -> Starts Photographer Website on http://localhost:5173" -ForegroundColor White
Write-Host "  npm run dev:web      -> Starts SnapFind Web on http://localhost:5174" -ForegroundColor White
Write-Host "  .\scripts\dev.ps1    -> Starts local dev environment" -ForegroundColor White

