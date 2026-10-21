@echo off
title SnapFind AI Backend (Port 8000)
cd /d "%~dp0services\backend"
echo Starting SnapFind FastAPI backend server on http://localhost:8000 ...

if exist ".\.venv\Scripts\activate.bat" (
    call ".\.venv\Scripts\activate.bat"
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
) else if exist ".\.venv\Scripts\python.exe" (
    .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
) else (
    echo [WARN] Virtual environment not found at services\backend\.venv. Falling back to system python...
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
)
