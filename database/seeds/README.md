# Database Seeds — SnapFind AI

This folder contains SQL seed scripts and data fixtures for local development and testing.

## Usage

### Applying seeds via Docker PostgreSQL
Run the seed SQL script directly against your running Postgres container:

```bash
docker exec -i snapfind-postgres psql -U snapfind_user -d snapfind_ai < database/seeds/001_initial_seed.sql
```

### Applying seeds via psql (native)
```bash
psql -U snapfind_user -d snapfind_ai -f database/seeds/001_initial_seed.sql
```

## Structure
- `001_initial_seed.sql`: Baseline mock/sample records (photographer profile, test events, photo metadata) designed for Phase 2 data verification.

