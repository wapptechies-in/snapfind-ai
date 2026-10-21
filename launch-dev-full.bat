@echo off
title SnapFind AI Local Full Stack (Backend + Web)
echo ===================================================
echo     SnapFind AI - Starting Full Dev Environment
echo ===================================================
echo.

REM Start Backend API in a separate terminal window
start "SnapFind API Server (Port 8000)" cmd /k "cd /d "%~dp0services\backend" && .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

REM Wait 2 seconds for backend initialization
timeout /t 2 /nobreak >nul

REM Start Vite Web Application in this window
cd /d "%~dp0"
echo Starting SnapFind Web Studio (Port 5173)...
npm run dev:web
