# SnapFind Web (`apps/snapfind-web`)

The photographer dashboard and (later) the customer gallery, both served
from this app. Phase 1 builds the photographer-facing side only.

**Phase 1 status:**
- `IMPLEMENTED` — routing, dashboard layout, sidebar, login/register
  screens, events list, and a live "Backend Status" indicator that
  actually calls the FastAPI backend.
- `MOCK` — all event/photo numbers, and the login/register forms (no
  real auth yet).
- `PLANNED` — Photos, Processing, QR Codes, and Settings sections
  (placeholder pages exist so navigation doesn't break).

## Setup

```bash
cd apps/snapfind-web
npm install
```

## Environment variables

Uses `VITE_API_BASE_URL` (see root `.env.example`). Defaults to
`http://localhost:8000` if not set.

## Run

```bash
npm run dev
```

Open http://localhost:5174 — you'll land on `/login`. Any email/password
works (mock auth); submitting takes you to `/dashboard`.

## Pages

- `/login`, `/register` — mock auth screens
- `/dashboard` — stat cards + recent events table (mock data) + backend status
- `/events` — filterable event list (mock data)
- `/photos`, `/processing`, `/qr-codes`, `/settings` — "planned" placeholders

## Folder structure

```
src/
├── layouts/        # AuthLayout, DashboardLayout
├── components/      # Sidebar, BackendStatusBadge
├── pages/           # Login, Register, Dashboard, Events, ComingSoon
├── services/         # api.ts (backend calls), useBackendStatus.ts, mockData.ts
└── types/            # shared TS types
```

## Stack

React 18 + TypeScript + Vite + Tailwind CSS + React Router.
