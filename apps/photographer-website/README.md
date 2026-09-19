# Photographer Website (`apps/photographer-website`)

The photographer's public-facing business website — branding,
portfolio, services, about, booking, and contact. This is not the
SnapFind SaaS dashboard (that's `apps/snapfind-web`); this site links
out to it via the "Find My Photos" CTA.

**Phase 2 status:**
- `IMPLEMENTED` — all 6 pages, category-filterable portfolio with a
  keyboard-accessible lightbox, a fully validated booking form
  (required fields, email/phone format, date, message length,
  success/error states), a contact form with validation, a
  config-driven header/footer, a "Find My Photos" CTA, and a
  lightweight SEO helper (title + meta description per page).
- `MOCK` — all photos (styled placeholders — see
  `src/data/portfolio.ts` to swap in real images), and both forms
  (booking + contact) — no backend endpoint is called yet.
- `PLANNED` — connecting `findMyPhotosUrl` to a live SnapFind gallery,
  real booking/contact submission to the FastAPI backend.

## Rebranding this site for a real client

Everything client-specific lives in one file:

```
src/config/siteConfig.ts
```

Business name, photographer name, phone/email/WhatsApp/address,
social links, nav labels, and the Find My Photos destination are all
there — no component needs to change.

Portfolio photos, categories, and services are separate editable data:

```
src/data/portfolio.ts
src/data/categories.ts
src/data/services.ts
```

To replace a placeholder photo with a real one, add `src` (and `alt`)
to the relevant entry in `portfolio.ts` — the `PlaceholderPhoto`
component automatically renders a real, lazy-loaded `<img>` once `src`
is set, and falls back to a styled placeholder when it isn't.

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

- `/` — Home (hero, categories, featured portfolio, about teaser, services teaser, why-choose-us, CTA)
- `/about` — About the photographer
- `/portfolio` — Filterable portfolio with lightbox (`?category=wedding` etc. pre-filters)
- `/services` — Full service list
- `/booking` — Booking enquiry form (validated, mock submission)
- `/contact` — Contact details, WhatsApp CTA, map placeholder, contact form

## Component structure

```
src/
├── config/siteConfig.ts        # all brand/contact/link content
├── data/                        # portfolio.ts, categories.ts, services.ts
├── components/
│   ├── layout/                  # Header, Footer
│   ├── hero/                    # Hero
│   ├── categories/               # CategoryCard
│   ├── portfolio/                # PortfolioGrid, PortfolioCard, PortfolioFilter, Lightbox
│   ├── services/                  # ServiceCard
│   ├── booking/                    # BookingForm
│   └── common/                      # SEO, PlaceholderPhoto, Section, WhyChooseUs, CTASection
├── pages/                             # Home, About, Portfolio, Services, Booking, Contact
├── services/bookingService.ts          # mock enquiry submission (swap-ready for a real API)
└── layouts/MainLayout.tsx
```

## Stack

React 18 + TypeScript + Vite + Tailwind CSS + React Router. No new
dependencies were added in Phase 2 — SEO tags are handled with a small
custom component instead of pulling in a routing/head library.
