/**
 * Portfolio categories. Used by the Portfolio filter and the homepage
 * category cards. `featured: true` categories are the ones shown as
 * cards on the homepage (spec section 8); the full list is used for
 * portfolio filtering (spec section 4/9).
 *
 * Status: MOCK content — descriptions are placeholder copy.
 */

export type Category = {
  slug: string;
  name: string;
  description: string;
  tone: "warm" | "cool" | "neutral";
  featured?: boolean;
};

export const categories: Category[] = [
  { slug: "wedding", name: "Weddings", description: "Full-day coverage, from getting ready to last dance.", tone: "warm", featured: true },
  { slug: "marriage", name: "Marriage", description: "Ceremony and traditional marriage functions.", tone: "warm" },
  { slug: "birthday", name: "Birthdays", description: "Milestone birthdays and family celebrations.", tone: "warm", featured: true },
  { slug: "sports", name: "Sports", description: "Fast-paced coverage of matches and tournaments.", tone: "cool", featured: true },
  { slug: "events", name: "Events", description: "Conferences, launches, and galas.", tone: "neutral", featured: true },
  { slug: "candid", name: "Candid", description: "Unposed, in-the-moment documentary shots.", tone: "neutral", featured: true },
  { slug: "family", name: "Family", description: "Relaxed sessions for families of any size.", tone: "warm", featured: true },
  { slug: "corporate", name: "Corporate", description: "Headshots, team photos, and brand imagery.", tone: "cool", featured: true },
  { slug: "nature", name: "Nature", description: "Landscape and outdoor location photography.", tone: "cool", featured: true },
  { slug: "other", name: "Other", description: "Custom or one-off photography requests.", tone: "neutral" },
];

export const featuredCategories = categories.filter((c) => c.featured);
