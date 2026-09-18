# Photographer Website (`apps/photographer-website`)

The public-facing site for the photographer — portfolio, services,
about, contact, and booking. This is the top of the funnel that
eventually links into SnapFind AI for guests to find their photos.

**Phase 1 status:** `IMPLEMENTED` — all six pages exist with real layout
and copy; photos are `MOCK` placeholders (styled gradient frames) until
real images are added; contact/booking forms are `MOCK` (no backend yet).

## Setup

```bash
cd apps/photographer-website
npm install
```

## Run

```bash
npm run dev
```

Open http://localhost:5173

## Pages

- `/` — Home
- `/about` — About
- `/portfolio` — Portfolio (filterable by category)
- `/services` — Services & pricing
- `/contact` — Contact form (mock)
- `/booking` — Booking request form (mock)

## Stack

React 18 + TypeScript + Vite + Tailwind CSS + React Router.
