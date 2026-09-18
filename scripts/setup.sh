#!/usr/bin/env bash
# SnapFind AI — Environment Setup Script (Linux/macOS)

set -e

echo "========================================="
echo "   SnapFind AI — Local Setup Script     "
echo "========================================="

# 1. Environment variable check
if [ ! -f ".env" ]; then
    echo "[1/3] Creating .env from .env.example..."
    cp .env.example .env
else
    echo "[1/3] .env already exists."
fi

# 2. Install root and workspace npm dependencies
echo "[2/3] Installing frontend dependencies via npm workspaces..."
npm install

# 3. Setup Python virtual environment
echo "[3/3] Setting up Python backend virtual environment..."
cd services/backend
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt
cd ../..

echo ""
echo "Setup complete! You can now run:"
echo "  npm run dev:website  -> Starts Photographer Website on http://localhost:5173"
echo "  npm run dev:web      -> Starts SnapFind Web on http://localhost:5174"
echo "  ./scripts/dev.sh     -> Starts local dev environment"

