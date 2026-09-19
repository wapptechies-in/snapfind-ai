# SnapFind AI — Backend (`services/backend`)

FastAPI backend for SnapFind AI.

**Phase 2 status:** `IMPLEMENTED` — JWT authentication, user registration/login, database models (Photographer, Event, Photo), Event CRUD APIs with status filtering, and aggregate dashboard metrics.

## Prerequisites

- Python 3.11+ (3.10 and 3.14 also supported)
- pip

## Setup

```bash
cd services/backend
python3 -m venv .venv

# macOS/Linux
source .venv/bin/activate
# Windows (PowerShell)
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

## Environment variables

Ensure your `.env` contains:

```bash
DATABASE_URL=postgresql://snapfind_user:snapfind_password@localhost:54320/snapfind_ai
SECRET_KEY=snapfind-secret-jwt-key-for-dev-only-change-in-prod-2026
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive OpenAPI docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## Tests

```bash
pytest
```

Runs test suites for auth flow, event CRUD, and dashboard aggregations.

## Folder structure

```
backend/
├── app/
│   ├── main.py        # FastAPI app + CORS + route registration + init_db lifespan
│   ├── core/
│   │   ├── config.py  # Application settings and JWT configuration
│   │   └── security.py # Password hashing (bcrypt) and JWT encode/decode (pyjwt)
│   ├── api/
│   │   ├── dependencies.py # get_current_photographer dependency
│   │   └── routes/
│   │       ├── health.py    # GET / health check
│   │       ├── auth.py      # POST /register, POST /login, GET /me
│   │       ├── events.py    # GET, POST, PUT, DELETE /events
│   │       └── dashboard.py # GET /dashboard/summary
│   ├── db/
│   │   └── session.py # Engine, SessionLocal, get_db, init_db, and fallback
│   ├── models/        # Photographer, Event, Photo SQLAlchemy models
│   └── schemas/       # User, Event, Dashboard, Photo Pydantic schemas
├── tests/
│   ├── test_auth.py
│   ├── test_events.py
│   ├── test_dashboard.py
│   └── test_health.py
└── requirements.txt
```
