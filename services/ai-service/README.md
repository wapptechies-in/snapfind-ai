# SnapFind AI Service — PLANNED (not yet implemented)

This folder is a placeholder for the AI/ML service that will power face
recognition and selfie search.

## What it will do

- Generate **face embeddings** from photos (via the desktop app or a
  server-side job)
- Store embeddings in a vector-searchable index
- Given a customer's selfie, run a **similarity search** to find every
  photo they appear in
- Expose this as an internal API that `services/backend` calls — it will
  not be reachable directly from the internet

## Planned stack

- Python
- A face detection/embedding model (candidates to evaluate later:
  `face_recognition` / `dlib`, `InsightFace`, or a cloud vision API)
- A vector index (candidates to evaluate later: `pgvector` inside the
  existing PostgreSQL database, or a dedicated vector DB)

## Status

`PLANNED` — no code yet. This is intentionally excluded from Phase 1.
It will be introduced once event/photo data and authentication exist
(Phase 2/3).
