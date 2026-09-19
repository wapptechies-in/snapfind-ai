/**
 * Centralized site configuration.
 *
 * Every piece of brand-specific content — names, contact details, social
 * links, and the Find My Photos destination — lives here. Components
 * should import from this file rather than hard-coding any of these
 * values, so the whole site can be rebranded for a real client by
 * editing this one file.
 *
 * Status: MOCK placeholder values — replace before this goes to a real
 * client. Nothing here is invented as fact (no fake awards/experience);
 * it's clearly placeholder copy.
 */

export const siteConfig = {
  businessName: "Marlowe & Finch Photography",
  photographerName: "Alex Marlowe",
  logoText: "Marlowe & Finch",
  tagline: "Your Moments. Beautifully Remembered.",

  // --- Contact ---
  phone: "+1 (555) 010-0100",
  email: "hello@marloweandfinch.studio",
  whatsapp: "+15550100100", // digits only, used to build a wa.me link
  address: "Hartwell & the surrounding coast — available to travel",

  // --- Social ---
  social: {
    instagram: "https://instagram.com/example",
    facebook: "https://facebook.com/example",
    youtube: "https://youtube.com/@example",
  },

  // --- SnapFind integration ---
  // Where the "Find My Photos" CTA sends guests. Points at the SnapFind
  // Web app (apps/snapfind-web, runs on :5174 in local dev). Phase 2 only
  // wires up this link — SnapFind's own gallery/search UI is a separate,
  // later phase.
  findMyPhotosUrl: "http://localhost:5174/login",

  // --- Navigation ---
  nav: [
    { label: "Home", to: "/" },
    { label: "About", to: "/about" },
    { label: "Portfolio", to: "/portfolio" },
    { label: "Services", to: "/services" },
    { label: "Booking", to: "/booking" },
    { label: "Contact", to: "/contact" },
  ],

  // --- SEO defaults ---
  seo: {
    defaultTitle: "Marlowe & Finch Photography — Wedding, Event & Portrait Photography",
    titleTemplate: "%s — Marlowe & Finch Photography",
    defaultDescription:
      "Wedding, sports, events and candid photography crafted to preserve the moments that matter.",
    siteUrl: "https://example.com",
  },

  // Placeholder — no dedicated Privacy/Terms pages in Phase 2 (spec
  // section 4 asks not to create unnecessary pages). Point these at
  // real pages when the client provides legal copy.
  legal: {
    privacyUrl: "#",
    termsUrl: "#",
  },
} as const;

export type SiteConfig = typeof siteConfig;
