# Database — SnapFind AI

This folder documents the PostgreSQL setup and fixtures for local development. The actual models and connection code live in `services/backend/app/db/` and `services/backend/app/models/`.

## Status: `IMPLEMENTED` (Phase 2 — Photographers, Events, Photos)

Phase 2 introduces the PostgreSQL database schema for:
- `photographers` (accounts with bcrypt password hashing)
- `events` (shoots with dates, status, photo counts, search metrics)
- `photos` (event image metadata & thumbnails)

## Local setup options

### Option A — Docker (recommended, fastest)

A `docker-compose.yml` is included in this folder. On Windows, port `54320:5432` is mapped to avoid Hyper-V dynamic port reservation conflicts.

From the repo root:

```bash
cd database
docker compose up -d
```

This starts PostgreSQL on `localhost:54320` with:
- database: `snapfind_ai`
- user: `snapfind_user`
- password: `snapfind_password`

Stop it with `docker compose down` (add `-v` to also wipe the volume data).

### Option B — SQLite Fallback (Zero Setup)

If Docker is not running, the backend automatically falls back to a local SQLite database (`snapfind_local.db`) so developers can test and develop without any external prerequisites.

## Connecting

Set this in your root `.env` (copied from `.env.example`):

```
DATABASE_URL=postgresql://snapfind_user:snapfind_password@localhost:54320/snapfind_ai
```

The backend reads this in `services/backend/app/core/config.py` and connects to it in `services/backend/app/db/session.py`.

## Seed Data

The database automatically initializes all tables and seeds initial test records on backend startup:
- Default test photographer: `photographer@example.com` / `password123`
- Studio: `Marlowe & Finch Photography`
- 6 initial event records and sample photo metadata.

Direct SQL fixture available in:
```bash
database/seeds/001_initial_seed.sql
```
