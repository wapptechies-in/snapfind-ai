# Database — SnapFind AI

This folder documents the PostgreSQL setup for local development. The
actual connection code lives in `services/backend/app/db/` (that's what
FastAPI imports); this folder is where schema/migration files will live
once Phase 2 introduces real tables.

## Status: `PLANNED` (connection architecture only in Phase 1)

Phase 1 sets up **how** the backend will talk to PostgreSQL. It does not
create any application tables (photographers, events, photos, etc.) yet —
that's Phase 2.

## Local setup options

### Option A — Docker (recommended, fastest)

A `docker-compose.yml` is included in this folder. From the repo root:

```bash
cd database
docker compose up -d
```

This starts PostgreSQL on `localhost:5432` with:
- database: `snapfind_ai`
- user: `snapfind_user`
- password: `snapfind_password`

Stop it with `docker compose down` (add `-v` to also wipe the data).

### Option B — Native PostgreSQL install

- **macOS:** `brew install postgresql@16` then `brew services start postgresql@16`
- **Windows:** install from https://www.postgresql.org/download/windows/

Then create the database manually:

```sql
CREATE DATABASE snapfind_ai;
CREATE USER snapfind_user WITH PASSWORD 'snapfind_password';
GRANT ALL PRIVILEGES ON DATABASE snapfind_ai TO snapfind_user;
```

## Connecting

Whichever option you use, set this in your root `.env` (copied from
`.env.example`):

```
DATABASE_URL=postgresql://snapfind_user:snapfind_password@localhost:5432/snapfind_ai
```

The backend reads this in `services/backend/app/core/config.py` and
connects to it in `services/backend/app/db/session.py`.

## Migrations

Empty for now. Phase 2 will introduce Alembic migrations here
(`database/migrations/`) once the first tables (photographers, events,
photos) are designed.
