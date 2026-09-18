# SnapFind Desktop App — PLANNED (not yet implemented)

This folder is a placeholder for the SnapFind AI desktop application.

## What it will do

The desktop app is what a photographer installs on their own Mac or Windows
machine. It will:

- Watch a local folder (or external SSD) of RAW/JPEG photos
- Generate **web-resolution images** and **thumbnails** for the cloud gallery
- Generate **face embeddings** locally (or send images to the AI service)
  so customers can find themselves in a gallery with a selfie search
- Upload only the derived assets (web images, thumbnails, face embeddings)
  to the cloud — **original RAW/JPEG files never leave the photographer's
  machine automatically**

## Planned stack

- Electron
- TypeScript
- Local SQLite cache (to track what's already been processed/uploaded)

## Status

`PLANNED` — no code yet. This will be built in a later phase, after:

1. Phase 1 — Project foundation (current phase)
2. Phase 2 — Auth + real event/photo APIs
3. Phase 3 — AI face recognition service
4. Phase 4 — Desktop processor (this folder)

Do not add implementation code here until that phase begins.
