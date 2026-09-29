# SnapFind AI — Controlled Windows Desktop Pilot Guide

This guide describes how to operate, provision, and deploy the controlled Windows desktop pilot for **SnapFind AI** (Single-Client, Single-Event Pilot).

---

## 1. System Architecture & Prerequisites

### Architecture Overview
The pilot connects the standalone Windows Desktop application (`SnapFind Desktop.exe`) to the FastAPI backend API running in staging or local environments.
- **Desktop Application**: Electron + React/Vite client.
- **Backend API**: FastAPI service managing authentication, multi-tenant events, presigned upload URLs, AI processing pipelines, and client public galleries.
- **Storage**: S3-compatible object storage (MinIO or AWS S3) for uploaded event photos and web derivatives.
- **Database**: PostgreSQL (with `pgvector` extension for facial embedding similarity) or SQLite in local verification mode.
- **Cache & Queue**: Redis for task orchestration and Celery/background workers.

### Server Environment Requirements
| Component | Requirement | Staging Default |
|---|---|---|
| Python Runtime | Python 3.10+ | 3.11 |
| Database | PostgreSQL 15+ with `pgvector` | `postgresql+asyncpg://...` |
| Redis | Redis 7+ | `redis://localhost:6379/0` |
| S3 Storage | S3 API (MinIO or AWS S3) | S3 Presigned URLs |
| Reverse Proxy | Nginx / Cloudflare | HTTPS with valid TLS certificate |

### Required Server Environment Variables
Configure the following in the staging environment (e.g. `.env` in `services/backend/`):

```bash
# Environment Mode (Must be 'staging' or 'production' for pilots)
# CRITICAL: Setting ENVIRONMENT to 'staging' or 'production' disables dev seed users
ENVIRONMENT=staging
DEBUG=False

# Base URL & Domain
PUBLIC_URL=https://staging.snapfind.ai
API_V1_PREFIX=/api/v1

# Security & Tokens
SECRET_KEY=<generate-strong-64-char-random-secret>
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database
DATABASE_URL=postgresql+asyncpg://snapfind_user:<secure_password>@postgres:5432/snapfind_staging

# Object Storage
S3_ENDPOINT_URL=https://s3.staging.snapfind.ai
S3_ACCESS_KEY_ID=<secure_access_key>
S3_SECRET_ACCESS_KEY=<secure_secret_key>
S3_BUCKET_NAME=snapfind-staging-photos
S3_REGION=us-east-1

# Redis
REDIS_URL=redis://redis:6379/0

# Storage Presigned Expiry
PRESIGNED_URL_EXPIRY_SECONDS=3600
```

---

## 2. Server Deployment Steps

1. **Clone repository and checkout release tag**:
   ```bash
   git clone <repo-url> snapfind-ai
   cd snapfind-ai/services/backend
   ```
2. **Setup Python Virtual Environment**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. **Run Database Migrations & Initial Setup**:
   ```bash
   # Executes table schema creation and trial expiration migrations
   python -m app.db.migrate_trial_expiration
   ```
4. **Start the API Service (with Gunicorn/Uvicorn)**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 --proxy-headers
   ```
5. **Verify Endpoint Health**:
   ```bash
   curl -I https://staging-api.snapfind.ai/health
   # Returns 200 OK
   ```

---

## 3. Operator Trial Provisioning Procedure

The pilot uses a dedicated CLI provisioning tool (`scripts/provision_trial.py`) that creates an approved, time-limited trial photographer account and initializes exactly one isolated event on the free trial tier.

### Operator Command Usage
Run the script from the backend virtual environment:

```bash
cd services/backend
python scripts/provision_trial.py \
  --email "pilot.photographer@clientstudio.com" \
  --studio "Summit Light Photography" \
  --event-name "Elena & Marcus Wedding" \
  --event-date "2026-10-15" \
  --days 14
```

### What This Does:
1. Validates that the account does not already exist.
2. Generates a secure, 16-character cryptographically random password (`secrets.token_urlsafe(16)`).
3. Sets `subscription_tier = "free"`, `approval_status = "approved"`, and assigns a strict `trial_expires_at` timestamp (e.g. 14 days from now).
4. Creates exactly one active event scoped exclusively to this photographer's ID with a unique guest gallery token.
5. Prints the provisioning summary and private delivery instructions to the terminal console. **Credentials are never written to disk, committed to Git, or exposed via public endpoints.**

### Managing Active Trials

**Check Trial Status**:
```bash
python scripts/provision_trial.py --status pilot.photographer@clientstudio.com
```

**List All Provisioned Pilot Accounts**:
```bash
python scripts/provision_trial.py --list
```

**Revoke / Deactivate an Account Immediately**:
```bash
python scripts/provision_trial.py --revoke pilot.photographer@clientstudio.com
```

---

## 4. Private Credential Handoff Protocol

When delivering the pilot access to the photographer:
1. **Never Send Credentials in Plaintext Email/Slack**:
   - Deliver credentials using an end-to-end encrypted one-time secret service (e.g., 1Password Share, Bitwarden Send with 1-view limit and 24h expiration, or encrypted Signal message).
2. **Handoff Packet Contents**:
   - **Download Link**: URL to download the packaged `SnapFind Desktop Installer.exe` or `SnapFind Desktop.exe` portable build.
   - **Server Endpoint**: `https://staging-api.snapfind.ai` (preconfigured in production desktop builds).
   - **Photographer Email**: The provisioned email address.
   - **Temporary Password**: The generated one-time pilot password.
   - **Access Window**: Expiration date (14 days from provisioning).
   - **Event Name**: Pre-created event name.

---

## 5. Client Windows Installation & Verification Steps

### Packaging Options
The desktop build generates two Windows x64 deliverables in `desktop/release/`:
1. **Installer**: `SnapFind Desktop Setup <version>.exe` (NSIS Installer)
2. **Portable**: `SnapFind Desktop <version>.exe` (Standalone portable executable, no install required)

### Client Installation Steps:
1. Download `SnapFind Desktop Setup.exe` (or the portable binary) onto the client's 64-bit Windows 10/11 machine.
2. **Handling Unsigned Binary Warnings (Windows SmartScreen)**:
   - *Note for Operators*: Since pilot test builds are not signed with an expensive EV code-signing certificate (`sign: null`), Windows SmartScreen will display a warning dialog: `"Windows protected your PC - Microsoft Defender SmartScreen prevented an unrecognized app from starting."`
   - *Client Instructions*:
     1. Click **"More info"**.
     2. Verify the publisher is listed as Unknown or SnapFind AI.
     3. Click **"Run anyway"**.
3. Launch **SnapFind Desktop**.
4. The application opens directly to the **Sign In** screen.
5. In the top-right corner of the sign-in card, the server connection status badge will show:
   - Green dot: `Connected: https://staging-api.snapfind.ai`
   - If offline or unreachable, click **"Configure Server"** to confirm or update the backend URL.

---

## 6. End-to-End Pilot Workflow: Event, Upload, and Client Gallery

### Step 1: Login
- Enter the provisioned email and password.
- The desktop app authenticates with `POST /api/v1/auth/login`, stores the secure JWT in memory/local storage, and loads the photographer workspace.

### Step 2: Access Pre-Created Event
- The dashboard displays the pre-provisioned event (e.g. "Elena & Marcus Wedding") under **Events**.
- Pilot accounts are restricted to free-tier quotas (maximum 2 events total, 500 photos per event).

### Step 3: Photo Upload & Privacy Disclosure
- Click **"Upload Photos"** within the event.
- Select a folder or drag-and-drop JPEG/RAW files from the local computer.
- **Privacy Notice & Explicit Consent**:
  - The upload confirmation dialog presents the clear privacy notice:
    > *"Selected photos will be uploaded to SnapFind AI secure cloud storage via encrypted presigned URLs for AI indexing, facial recognition, and web gallery optimization. Original files on your computer disk remain untouched."*
  - The photographer must check the consent confirmation checkbox: `[x] I understand and authorize uploading selected photos for AI indexing and web delivery.`
  - The "Start Upload Now" button is enabled only after consent is granted.

### Step 4: AI Indexing & Gallery Curation
- The desktop agent streams files directly to secure storage presigned URLs and triggers `POST /api/v1/events/{id}/process`.
- The AI pipeline computes facial embeddings (using MobileFaceNet/ArcFace) and image metadata embeddings.
- Photos are visible in the desktop Event Photos manager. Photographers can toggle public visibility for any photo (`PATCH /api/v1/photos/{id}/gallery-visibility`).

### Step 5: Client Public Gallery & Face Search
- Share the event gallery link with the client:
  `https://staging.snapfind.ai/gallery/{guest_share_token}`
- The client can view all curated photos and use **AI Selfie Search** to find photos of themselves without creating an account.

---

## 7. Multi-Tenant Data Isolation Guarantees

The SnapFind backend enforces strict tenant isolation at the API dependency layer:
- **No Shared Passwords / Universal Logins**: Every pilot photographer has an isolated cryptographic password hash (`bcrypt`).
- **Account Status & Expiration Checking**:
  - Every API request validates `approval_status == 'approved'` and `trial_expires_at > now()`.
  - If a trial has expired, the API immediately rejects requests with `403 Forbidden` (`TRIAL_EXPIRED: Your pilot access has expired.`).
- **Photographer-Scoped Data Isolation**:
  - All queries for events, photos, folders, upload sessions, and AI processing verify `event.photographer_id == current_photographer.id`.
  - Attempting to access another photographer's event or upload session immediately responds with `403 Forbidden` (`You do not have permission to access this event`).
  - Automated test coverage in `services/backend/tests/test_pilot_workflow.py` actively validates and proves these isolation constraints.

---

## 8. Pilot Revocation & Cleanup Procedure

When the pilot evaluation concludes or if access needs to be terminated:

1. **Immediate Revocation**:
   ```bash
   cd services/backend
   python scripts/provision_trial.py --revoke pilot.photographer@clientstudio.com
   ```
   This sets `approval_status = "suspended"`, instantly revoking all active JWT access tokens and preventing any subsequent logins or uploads.

2. **Data Cleanup (Optional)**:
   To completely purge the trial event, photos, and S3 objects:
   ```bash
   python scripts/cleanup_trial.py --email pilot.photographer@clientstudio.com --delete-data
   ```
   All database records and S3 bucket prefixes for the pilot photographer are permanently deleted.
