# SnapFind AI — Future SaaS Commercial Roadmap (Phase 2+)

## 1. Executive Summary

While the **Trial Edition (v1.0)** is configured for zero-cost operation with unlimited events and a strict 9.0 GB Cloudflare R2 safety cap, the entire **Commercial SaaS multi-tenant billing infrastructure** remains 100% architected, implemented, and preserved side-by-side.

This document outlines the commercial roadmap, pricing models, payment gateways, and migration path from the single-client trial to a multi-tenant commercial SaaS platform.

---

## 2. Preserved Commercial Architecture

All commercial code and data models are already fully integrated in the codebase:

### Database Models (`services/backend/app/models/user.py`):
- `User.subscription_tier`: `'free' | 'pro' | 'studio'`
- `User.subscription_status`: `'active' | 'canceled' | 'past_due'`
- `User.stripe_customer_id`: For automated Stripe recurring billing
- `User.custom_branding`: Studio logo & domain white-labeling
- `User.guest_paywall_enabled`: Monetizing guest photo downloads

### Backend Billing Router (`services/backend/app/api/routes/billing.py`):
- `GET /api/v1/billing/plans`: Returns full tier specifications, feature breakdowns, and dual pricing in USD and INR.
- `GET /api/v1/billing/subscription`: Real-time subscription state and gallery counts.
- `POST /api/v1/billing/upgrade`: Instant tier transitions.
- `POST /api/v1/billing/create-checkout-session`: Stripe checkout session creation.
- `POST /api/v1/billing/guest-checkout`: Guest direct photo purchase and print order checkout.
- `GET /api/v1/billing/verify-purchase/{token}`: Secure cryptographic download token verification.

---

## 3. Commercial Tiers & Pricing Matrix

| Feature / Quota | Free Starter | Studio Pro ($29 / ₹2,499) | Studio Enterprise ($79 / ₹6,499) |
|---|---|---|---|
| **Monthly Storage** | 9.0 GB (Cloudflare R2 Free) | 250 GB Cloud Storage | 1.0 TB+ High-Performance Cloud |
| **Active Event Galleries** | 2 active galleries (trial has unlimited) | 25 active galleries | **Unlimited** galleries |
| **Photos per Gallery** | 500 photos | 5,000 photos | 25,000 photos |
| **AI Facial Recognition** | Standard InsightFace | Priority InsightFace GPU | Dedicated GPU Queue + Auto-Retouching |
| **Guest Download Paywall** | Disabled | 10% platform fee | **0% fee (Photographer keeps 100%)** |
| **Custom Studio Branding** | SnapFind AI Watermark | White-label portal + Studio logo | Custom Domain (CNAME) + Custom Emails |
| **Desktop Ingestion Speed** | 4 parallel threads | 16 parallel threads | 32 parallel threads + Raw ingest |

---

## 4. Multi-Tenant Cloud Scaling Strategy

When scaling beyond the free single-client trial:

### Storage Strategy:
- **Cloudflare R2 (Paid Tier)**:
  - Base: \$0.015 per GB / month for storage above 10 GB.
  - Egress: **$0.00 / GB** (Industry-leading advantage over AWS S3 where egress costs \$0.09/GB).
  - 100 GB storage = \$1.35 / month.
  - 1 TB storage = \$14.85 / month.

### Database Scaling:
- **Supabase Pro Tier (\$25 / month)**:
  - 8 GB disk included, automated daily backups, 100,000 MAU.
  - Unlimited pgvector embeddings indexing with HNSW cosine distance index.

### Compute Scaling:
- **Render Standard (\$7 - \$25 / month)**:
  - Dedicated CPU and persistent RAM (prevents cold starts for InsightFace ONNX loading).
  - Or containerized deployment on **DigitalOcean Kubernetes** / **AWS ECS Fargate**.

---

## 5. Activating Commercial SaaS Mode

To switch the application from Trial Edition to Commercial SaaS:

1. Update backend environment configuration (`services/backend/.env`):
   ```env
   # Switch off trial edition mode
   TRIAL_EDITION_MODE=False

   # Payment Gateway Keys
   STRIPE_API_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   RAZORPAY_KEY_ID=rzp_live_...
   RAZORPAY_KEY_SECRET=...
   ```
2. Restart backend:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
3. The desktop and web applications will immediately reflect the 3 commercial tiers, enforce the 2-event cap for free accounts, and route photographers through the integrated Stripe / Razorpay checkout flows.
