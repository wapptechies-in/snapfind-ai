# SnapFind AI — Production Deployment & Cloud Infrastructure Guide

This guide details how to deploy SnapFind AI into a high-availability production cloud environment with automated Let's Encrypt SSL certificates, PostgreSQL `pgvector`, Redis Celery workers, and high-speed Cloudflare R2 / AWS S3 object storage with CDN caching.

---

## 1. Production Architecture Overview

The production deployment leverages Docker Compose with **Traefik v3** as the edge reverse proxy:

```
                  [ Public Internet ]
                           │
             HTTPS (Port 443) / HTTP (Port 80)
                           │
                    ▼──────────────▼
                    │  Traefik v3  │ ──► Automated Let's Encrypt SSL/TLS 1.3
                    ▲──────────────▲
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
     [ Studio Web ]   [ Portfolio ]   [ Backend API ]
       (Port 80)        (Port 80)       (Port 8000)
            │                             │
       Nginx SPA                     FastAPI / Uvicorn
                                          │
                        ┌─────────────────┼─────────────────┐
                        ▼                 ▼                 ▼
                 [ PostgreSQL 16 ]    [ Redis 7 ]    [ Cloudflare R2 / S3 ]
                   (+ pgvector)      (Celery Queue)   (+ CloudFront CDN)
                                          │
                                   [ Celery Worker ]
                                     (AI Buffalo_S)
```

---

## 2. Server Prerequisites

- **Host Specs**: Ubuntu 22.04+ LTS, Debian 12+, or AWS Amazon Linux 2023.
  - Minimum: 2 vCPU, 4GB RAM (8GB recommended for concurrent InsightFace AI vector jobs).
  - Storage: 40GB+ NVMe SSD.
- **Tools**: Docker Engine 24+ & Docker Compose v2 (`docker compose version`).
- **DNS Records**:
  Point your domain and subdomains to your server's public IP address via `A` records:
  - `yourstudio.com` -> `<Server IP>`
  - `studio.yourstudio.com` -> `<Server IP>`
  - `api.yourstudio.com` -> `<Server IP>`

---

## 3. Step-by-Step Deployment

### Step 1: Clone Repository & Create Production Environment
```bash
git clone https://github.com/your-org/snapfind-ai.git
cd snapfind-ai

# Copy production configuration template
cp .env.production.example .env.production
```

### Step 2: Configure `.env.production`
Edit `.env.production` with your live settings:
```bash
nano .env.production
```

Key values to configure:
- `PORTFOLIO_DOMAIN`: Your primary domain (e.g. `yourstudio.com`)
- `STUDIO_DOMAIN`: Studio dashboard and customer gallery subdomain (e.g. `studio.yourstudio.com`)
- `API_DOMAIN`: Backend API subdomain (e.g. `api.yourstudio.com`)
- `ACME_EMAIL`: Your email for Let's Encrypt expiry notices
- `SECRET_KEY`: Generate via `python3 -c "import secrets; print(secrets.token_hex(32))"`
- `POSTGRES_PASSWORD`: Strong password for production database

---

## 4. Cloud Object Storage & CDN Setup

### Option A: Cloudflare R2 ($0 Egress Fees — Highly Recommended)
Event photography downloads can reach hundreds of gigabytes per wedding. Cloudflare R2 has **$0 egress fees**, saving thousands in AWS bandwidth costs:

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) -> **R2** -> **Create bucket** (name: `snapfind-photos`).
2. Go to **Manage R2 API Tokens** -> **Create API Token** with `Object Read & Write` permissions.
3. Note your **Account ID**, **Access Key ID**, and **Secret Access Key**.
4. In the R2 bucket settings, connect a custom domain (e.g. `cdn.yourstudio.com`) for free global edge caching.
5. In `.env.production`:
   ```ini
   STORAGE_PROVIDER=r2
   CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
   STORAGE_ACCESS_KEY=your_r2_access_key
   STORAGE_SECRET_KEY=your_r2_secret_key
   STORAGE_BUCKET_NAME=snapfind-photos
   STORAGE_CDN_URL=https://cdn.yourstudio.com
   ```

### Option B: AWS S3 + CloudFront CDN
1. Create an S3 bucket in your target region (e.g. `us-east-1`).
2. Create an IAM User with `AmazonS3FullAccess` and generate Access Keys.
3. Set up a CloudFront distribution pointing to your S3 bucket as origin.
4. In `.env.production`:
   ```ini
   STORAGE_PROVIDER=s3
   STORAGE_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
   STORAGE_SECRET_KEY=your_aws_secret_key
   STORAGE_BUCKET_NAME=snapfind-production-photos
   STORAGE_REGION=us-east-1
   STORAGE_CDN_URL=https://d123456abcdef.cloudfront.net
   ```

---

## 5. Launching the Production Stack

```bash
# Build and launch all services in detached mode
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

### Checking Container Health
```bash
docker compose -f docker-compose.prod.yml ps
```

Traefik will automatically reach out to Let's Encrypt and provision SSL certificates for all configured domains within 30 seconds.

---

## 6. Verifying Infrastructure Health

Run the automated health checker script:
```bash
python3 deploy/check-production-health.py
```

Expected output:
```
=================================================================
   SnapFind AI — Production Health & Infrastructure Probe
=================================================================
✅ [OK] Backend Health Check responded with HTTP 200 in 12ms
✅ [OK] Backend Events API responded with HTTP 200 in 18ms
✅ [OK] SnapFind Web App (Studio) responded with HTTP 200 in 5ms
✅ [OK] Photographer Portfolio Site responded with HTTP 200 in 4ms
-----------------------------------------------------------------
✅ [OK] All core application probes PASSED with 100% availability!
```

---

## 7. Database Backups & Maintenance

### Automated Daily Backup Script
Save to `/opt/backup-snapfind.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/snapfind"
mkdir -p "$BACKUP_DIR"

docker exec snapfind-postgres pg_dump -U snapfind_user -d snapfind_ai -Fc > "$BACKUP_DIR/snapfind_db_$DATE.dump"

# Keep last 14 days of backups
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +14 -delete
```
Add to crontab:
```cron
0 2 * * * /opt/backup-snapfind.sh > /var/log/snapfind-backup.log 2>&1
```

---

## 8. Zero-Downtime Application Updates

When updating code:
```bash
git pull origin main
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build --no-deps backend worker web portfolio
```
Traefik ensures seamless rolling traffic switches with zero HTTP downtime for active users.

