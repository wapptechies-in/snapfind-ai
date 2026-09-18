# SnapFind AI — Local Development Guide

Welcome to the development guide for SnapFind AI. This document outlines everything needed to configure, develop, test, and debug the platform locally.

---

## 1. Prerequisites

Ensure the following tools are installed:
- **Node.js**: `v18.18+` (LTS recommended)
- **npm**: `v9+` or `v10+`
- **Python**: `3.10` or `3.11+`
- **Docker Desktop**: For running PostgreSQL locally
- **Git**: For source version control

---

## 2. Initial Setup

### Step 1: Clone and Configure Environment
Copy `.env.example` to `.env` in the repository root:

```bash
cp .env.example .env
```

### Step 2: Install Frontend Dependencies
SnapFind AI uses npm workspaces. Installing dependencies at the root installs them for all workspace apps (`photographer-website` and `snapfind-web`):

```bash
npm install
```

### Step 3: Configure Python Backend
Set up a virtual environment for the FastAPI backend:

```bash
cd services/backend
python -m venv .venv

# Activate on Linux/macOS:
source .venv/bin/activate

# Activate on Windows (PowerShell):
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt
cd ../..
```

---

## 3. Running the Stack

### Option A: Running Services Individually

1. **Start PostgreSQL**:
   ```bash
   docker compose up -d postgres
   ```
2. **Start Backend API** (Runs on port `8000`):
   ```bash
   cd services/backend
   uvicorn app.main:app --reload --port 8000
   ```
3. **Start Photographer Website** (Runs on port `5173`):
   ```bash
   npm run dev:website
   ```
4. **Start SnapFind Web Dashboard** (Runs on port `5174`):
   ```bash
   npm run dev:web
   ```

### Option B: Using Automated Scripts

Convenience scripts are provided in the `scripts/` folder:

- **Windows PowerShell**:
  ```powershell
  .\scripts\dev.ps1
  ```
- **Bash (Linux/macOS)**:
  ```bash
  ./scripts/dev.sh
  ```

---

## 4. Verification & Testing

- **Backend Health Check**:
  Navigate to [http://localhost:8000](http://localhost:8000) or inspect interactive API docs at [http://localhost:8000/docs](http://localhost:8000/docs).
- **Run Backend Tests**:
  ```bash
  cd services/backend
  pytest
  ```
- **Type Checking Frontends**:
  ```bash
  npm run build:website
  npm run build:web
  ```

---

## 5. Seeding Data (Phase 2 Preview)
To apply development database fixtures:
```bash
docker exec -i snapfind-postgres psql -U snapfind_user -d snapfind_ai < database/seeds/001_initial_seed.sql
```

