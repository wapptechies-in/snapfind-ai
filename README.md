# SnapFind AI

**Scan. Find. Relive.**

SnapFind AI is a photography platform that connects a photographer's
personal website, a photographer/customer web app, and (eventually) a
desktop app for processing photos — so that anyone who attended an
event can find every photo they're in with a QR code and a selfie,
without a photographer having to manually sort or tag anything.

This repository is being built **phase by phase**. This README
describes **Phase 1 — Project Foundation**: the monorepo structure,
both frontend apps, the backend skeleton, and the database connection
architecture. No AI, authentication, or production features exist yet
— see [Current limitations](#current-limitations) below.

---

## 1. What SnapFind AI is

- A **photographer** shoots an event and selects photos or whole folders via the SnapFind Desktop app.
- The **desktop app** directly streams selected images to secure staging storage via encrypted presigned upload URLs with explicit operator consent. Local files on disk remain completely untouched and unmodified.
- Cloud-side **AI processing workers** automatically generate optimized web images, thumbnails, and 512-d facial embeddings.
- A **customer/guest** scans a QR code from the event, uploads a selfie, and SnapFind AI performs vector similarity search to show them every photo they appear in.
- The **photographer** manages events, uploads, guests, and settings from both the Web and Desktop apps.

## 2. Project architecture

```
PHOTOGRAPHER DASHBOARD / DESKTOP APP
            │
            ├─► Selected Photo Files (Streamed to Secure S3/MinIO via Presigned URLs)
            │   (Local files on disk remain untouched and unmodified)
            ▼
FASTAPI BACKEND & AI PIPELINE
            │
            ├── Server-Side Asynchronous Workers (Celery / Direct Fallback)
            ├── Web-Optimized Derivative & Thumbnail Generation
            ├── Face Detection & 512-d Facial Embedding Extraction (InsightFace / ArcFace)
            └── PostgreSQL + pgvector (Event-Scoped Cosine Vector Search)
            │
            ▼
GUEST EXPERIENCE & CLIENT GALLERY
            │
            ├── Public Event QR Code Access
            ├── Biometric-Protected Guest Selfie Search (Ephemeral selfie, no permanent storage)
            └── Watermarked Previews & High-Resolution Downloads
```

See [`docs/architecture.md`](docs/architecture.md) for the full breakdown,
including what's implemented vs. planned at each layer.

## 3. Applications

| App | What it's for | Status |
|---|---|---|
| Photographer Website | Public site — portfolio, services, booking | Built (Phase 1) |
| SnapFind Web | Photographer dashboard + customer gallery | Dashboard built (Phase 1); gallery planned |
| Backend API | Serves both web apps | Health check only (Phase 1) |
| Desktop App | Local photo processing | Not started |
| AI Service | Face recognition / selfie search | Not started |

## 4. Technology stack

- **Photographer Website** — React, TypeScript, Vite, Tailwind CSS
- **SnapFind Web** — React, TypeScript, Vite, Tailwind CSS
- **Backend** — Python, FastAPI
- **Database** — PostgreSQL
- **AI service** — Python (planned)
- **Desktop app** — Electron + TypeScript (planned)

## 5. Folder structure

```
snapfind-ai/
│
├── apps/
│   ├── photographer-website/   # React + Vite + Tailwind — public site
│   └── snapfind-web/           # React + Vite + Tailwind — dashboard/gallery
│
├── services/
│   ├── backend/                # FastAPI backend
│   └── ai-service/             # Face embeddings & similarity search (Phase 3)
│
├── desktop/
│   └── snapfind-processor/     # Electron app for local photo processing (Phase 4)
│
├── database/
│   ├── migrations/             # Alembic database migrations
│   ├── seeds/                  # SQL seed data fixtures
│   └── docker-compose.yml      # Standalone Postgres compose
│
├── docs/
│   ├── architecture.md         # System architecture & component design
│   ├── development.md          # Local setup & developer workflow guide
│   └── deployment.md           # Production deployment & container guide
│
├── scripts/                    # Developer setup & launch automation scripts
│
├── .env.example
├── .gitignore
├── docker-compose.yml          # Root multi-service compose orchestration
├── package.json                # npm workspaces root
└── README.md                   # you are here
```

## 6. Prerequisites

Check these before starting:

```bash
node --version      # v18.18+ recommended
npm --version
python3 --version   # 3.11+ recommended (3.10 also works)
git --version
```

Also decide how you'll run PostgreSQL locally — either Docker (easiest)
or a native install. See [`database/README.md`](database/README.md) for
both options.

If anything is missing:

- **Node.js** — https://nodejs.org (LTS version)
- **Python** — https://www.python.org/downloads/
- **Git** — https://git-scm.com/downloads
- **Docker Desktop** (optional, for Postgres) — https://www.docker.com/products/docker-desktop/

## 7. Installation

```bash
git clone <this-repo-url> snapfind-ai
cd snapfind-ai

# Environment variables
cp .env.example .env
# then edit .env with real local values (defaults work with the
# Docker Postgres setup below)

# Frontend apps (installs both, via npm workspaces)
npm install

# Backend
cd services/backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ../..
```

## 8. How to run the photographer website

```bash
cd apps/photographer-website
npm run dev
```
Open http://localhost:5173

## 9. How to run SnapFind Web

```bash
cd apps/snapfind-web
npm run dev
```
Open http://localhost:5174 (starts at `/login`)

## 10. How to run the backend

```bash
cd services/backend
source .venv/bin/activate        # if not already active
uvicorn app.main:app --reload --port 8000
```
Open http://localhost:8000 (health check) or http://localhost:8000/docs
(interactive API docs).

Start Postgres first if you want the backend able to connect (it will
still run without it in Phase 1, since no routes query the database
yet):
```bash
cd database
docker compose up -d
```

## 11. How to configure environment variables

All variables live in one root `.env` file (copied from `.env.example`):

- `DATABASE_URL` — used by the backend to connect to PostgreSQL
- `SECRET_KEY` — placeholder for future auth (Phase 2); not used yet
- `VITE_API_BASE_URL` — used by SnapFind Web to reach the backend
- `CORS_ORIGINS` — origins the backend accepts requests from

Never commit `.env` — it's already in `.gitignore`. Only `.env.example`
(with empty/placeholder values) is committed.

## 12. Current limitations (Phase 1)

The following are **implemented in Phase 2**:
- ✅ JWT authentication & bcrypt password hashing (`/api/v1/auth`)
- ✅ PostgreSQL database schema and models for photographers, events, photos
- ✅ Events CRUD API (`/api/v1/events`) with status filtering
- ✅ Dashboard summary API (`/api/v1/dashboard/summary`) with real database metrics
- ✅ Connected SnapFind Web with live authentication, session persistence, event creation
- ✅ Completed Photographer Website with portfolio, lightbox, and booking form

The following remain for **future phases**:
- No AI, face recognition, or selfie search (Phase 3)
- No desktop app processing (Phase 4)
- No cloud storage / payments / production hardening (Phase 5)

## 13. Development phases

1. **Phase 1 — Project foundation** ✅ *(completed)*
2. **Phase 2 — Auth + real data** ✅ *(completed)* — user accounts, Postgres schema, real event/photo CRUD APIs, photographer website
3. **Phase 3 — AI face recognition** — face embeddings, vector search, selfie-search API
4. **Phase 4 — Desktop processor** — Electron app that generates and uploads derivatives while keeping originals local
5. **Phase 5 — Production hardening** — payments, cloud deployment, QR code generation, advanced analytics

Each phase begins only when explicitly requested.
