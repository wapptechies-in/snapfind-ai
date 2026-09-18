# SnapFind AI — Architecture

## The full vision (all phases)

```
PHOTOGRAPHER PERSONAL WEBSITE
            │
            ▼
       SNAPFIND AI
            │
      ┌─────┴─────┐
      ▼           ▼
Photographer   Customer
Dashboard      Gallery
      │           │
      │          QR
      │           │
      │       Find My Photos
      │           │
      │       Selfie Search
      │
      ▼
SnapFind Desktop App
      │
      ▼
Photographer's Local Photos
      │
      ├── Original RAW/JPEG → remain on local/external storage
      │
      ├── Web Images → cloud
      ├── Thumbnails → cloud
      └── Face Embeddings → cloud database
```

A photographer's **original files never leave their machine automatically**.
The desktop app (built in a later phase) will generate lightweight
derivatives — web-resolution images, thumbnails, and face embeddings — and
only those go to the cloud.

## Applications

| App | Folder | Audience | Stack |
|---|---|---|---|
| Photographer Website | `apps/photographer-website` | Public visitors, potential clients | React + TypeScript + Vite + Tailwind |
| SnapFind Web | `apps/snapfind-web` | Photographers (dashboard) and customers (gallery) | React + TypeScript + Vite + Tailwind |
| Backend API | `services/backend` | Both web apps, and later the desktop app | Python + FastAPI |
| Desktop App | `desktop/snapfind-processor` | Photographers, installed locally | Electron + TypeScript (planned) |
| AI Service | `services/ai-service` | Internal only, called by the backend | Python (planned) |
| Database | `database` | Backend only | PostgreSQL |

## Phase plan

- **Phase 1 — Project foundation** *(current phase)*
  Monorepo structure, both frontend apps scaffolded with real pages and
  mock data, FastAPI backend with a single health-check route, database
  connection architecture (no schema yet), a working frontend↔backend
  connectivity check, README, Git initialized.

- **Phase 2 — Auth + real data** *(not started)*
  Real user registration/login, PostgreSQL schema for photographers,
  events, and photos, real (non-mock) dashboard data, event CRUD APIs.

- **Phase 3 — AI face recognition** *(not started)*
  Face embedding generation, vector search, selfie-search API.

- **Phase 4 — Desktop processor** *(not started)*
  Electron app that watches a local folder, generates web images/thumbnails/
  embeddings, and uploads only those derivatives.

- **Phase 5 — Production hardening** *(not started)*
  Payments, cloud deployment, advanced analytics, QR code generation for
  event galleries.

## Phase 1 data flow (what actually works today)

```
SnapFind Web (React)
      │
      │  GET /  (via src/services/api.ts)
      ▼
FastAPI backend  →  responds { "name": "SnapFind AI API", "status": "running" }
      │
      ▼
Dashboard shows "Backend Status: Connected" or "Backend Status: Offline"
```

Everything else in the SnapFind Web dashboard (event counts, photo counts,
etc.) is clearly labeled **MOCK** in the code and the UI — it is not read
from the database yet. PostgreSQL is configured (connection module,
`.env.example`) but no tables exist yet; that begins in Phase 2.

## Status legend used throughout the codebase

- `IMPLEMENTED` — real, working code
- `MOCK` — working UI backed by fake/local data, clearly labeled
- `PLANNED` — not built yet, described here or in a folder's README only
