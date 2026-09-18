# SnapFind AI — Development Launcher (Windows PowerShell)

Write-Host "Starting SnapFind AI development environment..." -ForegroundColor Cyan

# Check if PostgreSQL container is running
$pgRunning = docker ps --filter "name=snapfind-postgres" --filter "status=running" -q
if (-not $pgRunning) {
    Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
    docker compose up -d postgres
} else {
    Write-Host "PostgreSQL is already running." -ForegroundColor Green
}

Write-Host "To run all services concurrently in separate terminals:" -ForegroundColor White
Write-Host "  Terminal 1 (Backend):  cd services\backend; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000" -ForegroundColor Gray
Write-Host "  Terminal 2 (Website):  npm run dev:website" -ForegroundColor Gray
Write-Host "  Terminal 3 (Web App):  npm run dev:web" -ForegroundColor Gray

