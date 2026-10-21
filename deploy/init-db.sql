-- SnapFind AI: PostgreSQL 16 + pgvector Database Initialization Script
-- Executed automatically on first container startup
-- Status: Idempotent and safe to run multiple times

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure UTF-8 collation and standard time zone
SET timezone = 'UTC';

