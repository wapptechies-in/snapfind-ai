# SnapFind AI — Development Launcher (Windows PowerShell)

Write-Host "Starting SnapFind AI development environment..." -ForegroundColor Cyan

# Check if Docker is available and PostgreSQL container is running
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCmd) {
    try {
        $null = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            $pgRunning = docker ps --filter "name=snapfind-postgres" --filter "status=running" -q
            if (-not $pgRunning) {
                Write-Host "Starting PostgreSQL, Redis, and MinIO containers..." -ForegroundColor Yellow
                docker compose up -d postgres redis minio create-bucket
            } else {
                Write-Host "PostgreSQL is already running." -ForegroundColor Green
                # Ensure Redis and MinIO are also running
                docker compose up -d redis minio create-bucket | Out-Null
            }
        } else {
            Write-Host "Docker daemon is offline. SnapFind backend will automatically use local SQLite (snapfind_local.db)." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Docker is offline. SnapFind backend will automatically use local SQLite (snapfind_local.db)." -ForegroundColor Yellow
    }
} else {
    Write-Host "Docker not installed. SnapFind backend will automatically use local SQLite (snapfind_local.db)." -ForegroundColor Yellow
}

Write-Host "To run all services concurrently in separate terminals:" -ForegroundColor White
Write-Host "  Terminal 1 (Backend):  cd services\backend; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000" -ForegroundColor Gray
Write-Host "  Terminal 2 (Website):  npm run dev:website" -ForegroundColor Gray
Write-Host "  Terminal 3 (Web App):  npm run dev:web" -ForegroundColor Gray

