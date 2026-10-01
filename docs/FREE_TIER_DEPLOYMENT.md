# SnapFind AI — Free Managed Cloud Deployment Guide ($0 Cost)

This guide walks you through deploying SnapFind AI completely for **$0 (Zero Cost)** using **Supabase** (PostgreSQL + pgvector), **Cloudflare R2** (10GB free object storage with $0 egress fees), **Render** (FastAPI backend), and **Vercel** (frontend web applications).

---

## Architecture Overview

```
                      [ Client Desktop Agent ]
                    (SnapFind Desktop Setup.exe)
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
[ Render Web Service ]                       [ Cloudflare R2 ]
 (FastAPI + InsightFace)                      (10GB Free Storage)
           │                                  ($0 Egress Downloads)
           ▼                                           │
  [ Supabase Database ]                                │
 (Postgres 16 + pgvector)                              │
           ▲                                           │
           └─────────────────────┬─────────────────────┘
                                 │
                    [ Vercel CDN Edge ]
        ┌────────────────────────┴────────────────────────┐
        ▼                                                 ▼
[ SnapFind Studio & Gallery ]                   [ Photographer Portfolio ]
(apps/snapfind-web)                             (apps/photographer-website)
```

---

## Step 1: Create Free Database on Supabase

1. Sign up for free at [supabase.com](https://supabase.com).
2. Click **New Project**:
   - **Name**: `snapfind-db`
   - **Database Password**: Choose a strong password and save it.
   - **Region**: Choose the region closest to you or your client.
3. Once the database is provisioned, go to the **SQL Editor** on the left menu and run:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Go to **Project Settings** (gear icon) -> **Database** -> scroll to **Connection String**:
   - Choose the **URI** tab.
   - Select **Direct connection** (port 5432).
   - The connection string looks like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```
   - For Python `psycopg`, prefix with `postgresql+psycopg://`:
     ```
     postgresql+psycopg://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```

---

## Step 2: Create Free Storage Bucket on Cloudflare R2

1. Sign up or log in at [cloudflare.com](https://dash.cloudflare.com).
2. On the left sidebar, click **R2** -> **Overview**.
3. Click **Create bucket**:
   - **Bucket Name**: `snapfind-photos`
   - **Location**: Automatic
   - Click **Create Bucket**.
4. Go back to the **R2** page and click **Manage R2 API Tokens** (right sidebar):
   - Click **Create API token**.
   - **Token Name**: `snapfind-backend-token`
   - **Permissions**: `Object Read & Write`
   - Click **Create API Token**.
5. Save the generated credentials:
   - **Account ID** (visible on R2 Overview page)
   - **Access Key ID**
   - **Secret Access Key**

---

## Step 3: Deploy Backend API on Render

1. Sign up at [render.com](https://render.com) and click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name**: `snapfind-api`
   - **Language / Environment**: `Docker`
   - **Root Directory**: `services/backend`
   - **Dockerfile Path**: `Dockerfile`
   - **Instance Type**: `Free`
4. In the **Environment Variables** section, add:

| Variable | Value | Notes |
|---|---|---|
| `ENVIRONMENT` | `production` | Enables production security & gates dev seeds |
| `DATABASE_URL` | `postgresql+psycopg://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres` | Your Supabase connection URI |
| `SECRET_KEY` | *(Generate a 64-char random hex)* | Python: `secrets.token_hex(32)` |
| `STORAGE_PROVIDER` | `r2` | Uses Cloudflare R2 |
| `CLOUDFLARE_R2_ACCOUNT_ID` | `<Your Cloudflare Account ID>` | From Cloudflare dashboard |
| `STORAGE_ACCESS_KEY` | `<Your R2 Access Key ID>` | From Cloudflare R2 token |
| `STORAGE_SECRET_KEY` | `<Your R2 Secret Access Key>` | From Cloudflare R2 token |
| `STORAGE_BUCKET_NAME` | `snapfind-photos` | Bucket created in Step 2 |
| `CORS_ORIGINS` | `*` | Or specify your Vercel domains |

5. Click **Create Web Service**.
6. When deployment finishes, test the endpoint:
   ```
   https://snapfind-api-sq4a.onrender.com/api/v1/health
   ```
   *(Expected response: `{"status": "ok", "app": "SnapFind AI API"}`)*

---

## Step 4: Deploy Frontends to Vercel

### 4.1 Deploy SnapFind Studio & Guest Gallery (`snapfind-web`)
1. Sign up or log in at [vercel.com](https://vercel.com) and click **Add New...** -> **Project**.
2. Import your GitHub repository.
3. Configure the project:
   - **Project Name**: `snapfind-studio`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click edit and keep `./` (monorepo root)
   - **Build Command**: `npm run build:web`
   - **Output Directory**: `apps/snapfind-web/dist`
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL` = `https://snapfind-api-sq4a.onrender.com` (Your Render API URL)
5. Click **Deploy**. Vercel will deploy your studio dashboard and guest face search gallery.

### 4.2 Deploy Photographer Portfolio Website (`photographer-website`)
1. In Vercel, click **Add New...** -> **Project** again.
2. Select the same repository.
3. Configure the project:
   - **Project Name**: `snapfind-portfolio`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Keep `./` (monorepo root)
   - **Build Command**: `npm run build:website`
   - **Output Directory**: `apps/photographer-website/dist`
4. Under **Environment Variables**, add:
   - `VITE_SITE_NAME` = `Apex Photography Studio`
5. Click **Deploy**.

---

## Step 5: Deliver Desktop App to Client

1. Open `desktop/src/api/client.ts` and set the production backend URL:
   ```typescript
   export const API_BASE_URL = "https://snapfind-api-sq4a.onrender.com";
   ```
2. Build the final Windows installer:
   ```bash
   cd desktop
   npm run dist:win
   ```
3. Locate the generated executable:
   ```
   desktop/release/SnapFind Desktop Setup 0.1.0.exe
   ```
4. Deliver to client:
   - **Desktop App**: `SnapFind Desktop Setup 0.1.0.exe`
   - **Web Studio Login**: `https://snapfind-studio.vercel.app`
   - **Credentials**: Provisioned photographer account email & password.
