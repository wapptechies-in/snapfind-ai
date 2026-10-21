#!/usr/bin/env bash
# SnapFind AI — Development Launcher (Linux/macOS)

echo "Starting SnapFind AI development environment..."

# Check if containers are running
if [ -z "$(docker ps -q -f name=snapfind-postgres -f status=running)" ]; then
    echo "Starting PostgreSQL, Redis, and MinIO infrastructure containers..."
    docker compose up -d postgres redis minio create-bucket
else
    echo "PostgreSQL is already running. Ensuring Redis & MinIO are running..."
    docker compose up -d redis minio create-bucket
fi

echo "To run all services concurrently in separate terminals:"
echo "  Terminal 1 (Backend):  cd services/backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000"
echo "  Terminal 2 (Website):  npm run dev:website"
echo "  Terminal 3 (Web App):  npm run dev:web"

