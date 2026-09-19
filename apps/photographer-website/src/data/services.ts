/**
 * Service offerings shown on the homepage (teaser) and the full
 * Services page. No prices — pricing is handled through enquiry per
 * the Phase 2 spec.
 *
 * Status: MOCK — placeholder descriptions.
 */

export type Service = {
  slug: string;
  title: string;
  description: string;
  suitableFor: string;
};

export const services: Service[] = [
  {
    slug: "wedding",
    title: "Wedding Photography",
    description: "Full-day documentary coverage, from getting ready through the last dance.",
    suitableFor: "Ceremonies, receptions, multi-day celebrations",
  },
  {
    slug: "event",
    title: "Event Photography",
    description: "Fast-turnaround coverage for conferences, launches, and galas.",
    suitableFor: "Corporate events, product launches, galas",
  },
  {
    slug: "sports",
    title: "Sports Photography",
    description: "High-speed coverage that captures the decisive moment in fast action.",
    suitableFor: "Matches, tournaments, race days",
  },
  {
    slug: "birthday",
    title: "Birthday Photography",
    description: "Relaxed, candid coverage of milestone birthdays and family celebrations.",
    suitableFor: "Kids' parties, milestone birthdays",
  },
  {
    slug: "candid",
    title: "Candid Photography",
    description: "Unposed, in-the-moment shots that capture people as they really are.",
    suitableFor: "Any event where genuine moments matter most",
  },
  {
    slug: "family",
    title: "Family Photography",
    description: "Natural-light sessions for families of any size, on location or at home.",
    suitableFor: "Family portraits, generational photos",
  },
  {
    slug: "corporate",
    title: "Corporate Photography",
    description: "Headshots, team photography, and brand imagery for your business.",
    suitableFor: "Headshots, team offsites, brand content",
  },
  {
    slug: "portrait",
    title: "Portrait Photography",
    description: "One-on-one sessions focused on a single subject, indoors or on location.",
    suitableFor: "Individuals, couples, professional portraits",
  },
];

export const featuredServices = services.slice(0, 4);
