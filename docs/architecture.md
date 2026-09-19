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

- **Phase 1 — Project foundation** ✅ *(completed)*
  Monorepo structure, both frontend apps scaffolded, FastAPI backend skeleton.

- **Phase 2 — Auth + real data** ✅ *(completed)*
  Real user registration/login with JWT and bcrypt, PostgreSQL schema for
  photographers, events, and photos, real dashboard data aggregation, event CRUD APIs,
  and completed photographer website (portfolio, lightbox, booking, SEO).

- **Phase 3 — AI face recognition** *(planned)*
  Face embedding generation, vector search, selfie-search API.

- **Phase 4 — Desktop processor** *(planned)*
  Electron app that watches a local folder, generates web images/thumbnails/
  embeddings, and uploads only those derivatives.

- **Phase 5 — Production hardening** *(planned)*
  Payments, cloud deployment, advanced analytics, QR code generation for
  event galleries.

## Phase 2 data flow

```
SnapFind Web (React)
      │
      ├── POST /api/v1/auth/login  →  JWT Bearer Token stored in localStorage
      │
      ├── GET /api/v1/dashboard/summary  →  Aggregated metrics from PostgreSQL
      │
      └── GET, POST, DELETE /api/v1/events  →  CRUD for photographer's events
            │
            ▼
      FastAPI Backend (app.main)
            │
            ▼
      PostgreSQL Database (Docker port 54320 or SQLite fallback)
```

## Status legend used throughout the codebase

- `IMPLEMENTED` — real, working code
- `MOCK` — working UI backed by fake/local data, clearly labeled
- `PLANNED` — not built yet, described here or in a folder's README only
