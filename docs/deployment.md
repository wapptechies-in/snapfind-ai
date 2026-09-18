# SnapFind AI — Production Deployment Guide

This document covers deployment strategies, containerization, environment considerations, and infrastructure requirements for production releases of SnapFind AI.

---

## 1. Architectural Overview

```
[ Internet / Clients ]
         │
         ▼
[ Reverse Proxy / Ingress: Nginx or Caddy / TLS ]
    ├── /           ──> Static SPA CDN / Container (Photographer Website)
    ├── /app        ──> Static SPA CDN / Container (SnapFind Web Dashboard)
    ├── /api        ──> FastAPI Backend (services/backend:8000)
    └── (internal)  ──> AI Service & PostgreSQL Database
```

---

## 2. Containerized Deployment (Docker)

A root-level `docker-compose.yml` provides container definitions for services:

### Production Build & Run
```bash
docker compose --profile full-stack up -d --build
```

### Services Breakdown
- **PostgreSQL (`postgres`)**:
  - Image: `postgres:16-alpine`
  - Mounts persistent named volume `snapfind_pgdata`
  - In production, prefer a managed database service (e.g. AWS RDS, GCP Cloud SQL, Supabase).
- **FastAPI API (`backend`)**:
  - Built from `services/backend/Dockerfile`
  - Configured with production CORS origins and database connection pooling.
- **AI Service (`services/ai-service`)**:
  - Microservice for face embeddings and vector indexing (Phase 3).

---

## 3. Frontend Static Hosting

Both frontends (`apps/photographer-website` and `apps/snapfind-web`) are Vite-based Single Page Applications (SPAs).

### Building Production Bundles
```bash
# Build Photographer Website (output: apps/photographer-website/dist)
npm run build:website

# Build SnapFind Web (output: apps/snapfind-web/dist)
npm run build:web
```

### Hosting Targets
- **Cloudflare Pages / Vercel / Netlify**:
  - Root directory: `apps/photographer-website` or `apps/snapfind-web`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Configure SPA rewrite rule (redirect `/*` to `/index.html`).
- **AWS S3 + CloudFront** or **Nginx**:
  - Serve static directory with gzip/brotli compression and browser caching.

---

## 4. Environment Variables Checklist

Ensure these variables are securely populated in production (do NOT check into version control):

| Variable | Target Service | Description |
|---|---|---|
| `DATABASE_URL` | Backend | Connection string to PostgreSQL instance |
| `SECRET_KEY` | Backend | Secure random string (min 32 chars) for JWT tokens |
| `ENVIRONMENT` | Backend | Set to `production` |
| `CORS_ORIGINS` | Backend | Allowed production domain origins |
| `VITE_API_BASE_URL` | SnapFind Web | Public URL of the production API (e.g., `https://api.snapfind.ai`) |
| `CLOUD_STORAGE_BUCKET` | Backend / AI | S3 or GCS bucket for processed images and thumbnails |

---

## 5. Security Recommendations
- **HTTPS & HSTS**: Enforce TLS 1.3 across all endpoints.
- **Database Isolation**: Keep PostgreSQL inside a private VPC subnet; never expose port 5432 to public internet.
- **Secrets Management**: Use AWS Secrets Manager, GCP Secret Manager, or Doppler rather than raw `.env` files on production servers.

