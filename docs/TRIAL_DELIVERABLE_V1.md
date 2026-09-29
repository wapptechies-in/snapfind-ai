# SnapFind AI — Client Trial Deliverable (v1.0-trial)

## 1. Overview & Business Objectives

SnapFind AI **Trial Edition (v1.0)** is an enterprise-grade AI event photography ingestion, facial recognition, and client delivery system designed specifically for the initial client deployment.

### Strategic Priorities:
1. **$0 Infrastructure & Zero-Overage Guarantee**:
   - The entire production stack runs on the 100% free tiers of **Supabase** (Postgres + pgvector), **Cloudflare R2** (S3 storage with $0 egress), **Render** (FastAPI backend), and **Vercel** (Vite SPA web portals).
   - **Hard 9.0 GB Storage Cap**: Cloudflare R2 provides 10.0 GB free monthly storage. SnapFind AI Trial Edition enforces a strict backend and frontend hard stop at **9.0 GB (9,663,676,416 bytes)**. This reserves a 1.0 GB safety buffer for thumbnails, compressed web derivatives, and database records, ensuring **zero risk of unexpected credit card charges or cloud overage fees**.
2. **Unlimited Events for Client Evaluation**:
   - Instead of locking down event creation or enforcing commercial subscription paywalls, the trial edition grants **unlimited event galleries**.
   - Photographers can create as many weddings, galas, and photoshoots as they wish, fully experiencing the workflow.
3. **Full Biometric & AI Power**:
   - InsightFace 512-dimension face embedding extraction (`buffalo_l`).
   - Guest QR selfie instant face matching.
   - Real-time indexing into PostgreSQL using pgvector cosine similarity search (`vector(512)`).
4. **Architectural Separation from Commercial SaaS**:
   - All commercial multi-tier SaaS code (Stripe, Razorpay, tier upgrades, enterprise plans) has been **100% preserved side-by-side** without breaking existing code.
   - The application dynamically operates in trial mode when `TRIAL_EDITION_MODE=True` (default), and can transition into full SaaS mode at any time with a single configuration flag.

---

## 2. Hard Quota & Enforcement Architecture

```
[Photographer Desktop App]              [Web Studio Dashboard]
        │                                        │
        ├───────────────────┬────────────────────┤
                            ▼
               GET /api/v1/billing/subscription
                            │
   Calculates actual disk usage via SQL SUM(file_size)
   Enforces: max_storage_bytes = 9.0 GB (9,663,676,416 bytes)
   Returns:  { used_storage_bytes, max_storage_bytes, is_trial_edition: true }
                            │
        ┌───────────────────┴────────────────────┐
        ▼                                        ▼
POST /api/v1/uploads/sessions/batch-init   POST /api/v1/photos/upload-init
        │                                        │
   [Pre-Flight Quota Check]                 [Pre-Flight Quota Check]
   Does (used + incoming) > 9.0 GB?         Does (used + file_size) > 9.0 GB?
        ├── YES ──> HTTP 413 CONTENT_TOO_LARGE (Upload Blocked)
        └── NO  ──> Signed S3/R2 URLs Generated & Upload Proceeds
```

### Storage Quota Guarantees:
- **Backend Enforced**:
  - `services/backend/app/api/routes/upload_sessions.py` verifies total batch size before issuing any signed URLs.
  - `services/backend/app/api/routes/photos.py` verifies single photo size before presigning.
- **Frontend / Desktop Pre-Flight Warning**:
  - `desktop/src/pages/FolderScan.tsx` calculates the folder size locally before upload initiation. If the folder would exceed the remaining trial quota, the upload button is disabled and a warning banner is displayed.
  - `desktop/src/components/Layout.tsx` and `apps/snapfind-web/src/components/Sidebar.tsx` display a persistent live storage progress bar (`X.X / 9.0 GB`).

---

## 3. Technology Stack & Managed Free Deployment

| Service | Role | Free Tier Specifications | Overages Risk |
|---|---|---|---|
| **Supabase** | PostgreSQL Database + pgvector extension | 500 MB storage, 50,000 MAU, free pgvector | None (Hard capped, 0 billing unless upgraded) |
| **Cloudflare R2** | Image Storage (Originals & Thumbnails) | 10 GB storage / month, 1M Class A ops, 10M Class B ops, **$0 Egress** | **100% Protected** (SnapFind hard stops at 9.0 GB) |
| **Render** | FastAPI Backend + InsightFace ONNX runtime | Free Web Service (512 MB RAM, 0.1 CPU, auto-sleeps after 15m) | None ($0 fixed) |
| **Vercel** | Photographer Web Studio & Client Portals | 100 GB bandwidth / month, unlimited deploys | None ($0 fixed) |
| **Electron** | Windows Desktop Photographer App | Local execution, direct S3 streaming to Cloudflare R2 | 0 hosting cost (Client hardware) |

---

## 4. Running & Validating the Trial Version

### Desktop Ingestion App (Windows):
1. Build installer:
   ```bash
   npm run dist:win -w desktop
   ```
2. The standalone installer is located at `desktop/dist/SnapFind Desktop Setup 0.1.0.exe`.
3. Launch and sign in with photographer credentials.
4. Verify that:
   - Sidebar displays `"Storage & Plan"` with `"9 GB Free"` badge.
   - Storage meter shows current utilization against 9.0 GB.
   - Creating new events is unlimited and bypasses any paywall.

### Web Studio (Photographer & Admin):
1. Accessible at `https://<your-project>.vercel.app`.
2. `"Storage & Plan"` page displays the Trial Edition Overview, Zero-Overage Guarantee details, and Roadmap Preview of future plans.

---

## 5. Transitioning from Trial to Commercial SaaS

When the client is ready to upgrade to multi-terabyte cloud storage or offer commercial subscriptions:
1. In `services/backend/app/core/config.py` (or environment variables), set:
   ```env
   TRIAL_EDITION_MODE=False
   ```
2. Enable Stripe / Razorpay credentials (`STRIPE_API_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
3. The platform instantly shifts to the 3-tier model (Free, Pro @ $29/mo, Studio @ $79/mo) documented in [`docs/FUTURE_SAAS_ROADMAP.md`](file:///e:/personal/snapfind-ai-phase1/snapfind-ai/docs/FUTURE_SAAS_ROADMAP.md).
