/**
 * Portfolio items. Each item points at an optional real image (`src`)
 * and always has a `tone`/`ratio` used to render a placeholder when no
 * real image is set yet. To swap in a real photo later, just set `src`
 * (and `alt`) — no component code needs to change.
 *
 * Status: MOCK — placeholder entries, no real client photos yet.
 */

export type PortfolioItem = {
  id: string;
  title: string;
  category: string; // matches a Category["slug"]
  ratio: "portrait" | "landscape" | "square";
  tone: "warm" | "cool" | "neutral";
  src?: string;
  alt: string;
  featured?: boolean;
};

export const portfolioItems: PortfolioItem[] = [
  { id: "p1", title: "Hartwell autumn wedding", category: "wedding", ratio: "landscape", tone: "warm", alt: "Bride and groom walking under autumn trees", featured: true },
  { id: "p2", title: "Riverside vineyard ceremony", category: "wedding", ratio: "portrait", tone: "warm", alt: "Outdoor wedding ceremony at a vineyard" },
  { id: "p3", title: "First dance, marquee reception", category: "wedding", ratio: "landscape", tone: "neutral", alt: "Couple's first dance under string lights" },
  { id: "p4", title: "Traditional marriage function", category: "marriage", ratio: "portrait", tone: "warm", alt: "Traditional marriage ceremony rituals" },
  { id: "p5", title: "8th birthday celebration", category: "birthday", ratio: "square", tone: "warm", alt: "Child blowing out birthday candles", featured: true },
  { id: "p6", title: "Milestone 60th birthday", category: "birthday", ratio: "landscape", tone: "neutral", alt: "Family gathered for a milestone birthday" },
  { id: "p7", title: "Championship match day", category: "sports", ratio: "landscape", tone: "cool", alt: "Athlete mid-play during a match", featured: true },
  { id: "p8", title: "Track finals", category: "sports", ratio: "square", tone: "cool", alt: "Runners crossing the finish line" },
  { id: "p9", title: "Northline product launch", category: "events", ratio: "landscape", tone: "neutral", alt: "Speaker presenting at a product launch", featured: true },
  { id: "p10", title: "Annual gala, grand hall", category: "events", ratio: "portrait", tone: "cool", alt: "Guests mingling at an evening gala" },
  { id: "p11", title: "Conference keynote", category: "events", ratio: "square", tone: "cool", alt: "Keynote speaker on stage" },
  { id: "p12", title: "Quiet moment, backstage", category: "candid", ratio: "portrait", tone: "neutral", alt: "Candid backstage portrait", featured: true },
  { id: "p13", title: "Laughing between shots", category: "candid", ratio: "square", tone: "warm", alt: "Candid laughter during a break" },
  { id: "p14", title: "Coastal family session", category: "family", ratio: "square", tone: "warm", alt: "Family portrait on a beach", featured: true },
  { id: "p15", title: "Three generations", category: "family", ratio: "landscape", tone: "warm", alt: "Grandparents, parents and children together" },
  { id: "p16", title: "Founder headshots", category: "corporate", ratio: "portrait", tone: "cool", alt: "Professional corporate headshot", featured: true },
  { id: "p17", title: "Team offsite", category: "corporate", ratio: "landscape", tone: "neutral", alt: "Company team photo outdoors" },
  { id: "p18", title: "Coastal cliffs at dawn", category: "nature", ratio: "landscape", tone: "cool", alt: "Coastal cliffs at sunrise", featured: true },
  { id: "p19", title: "Forest light", category: "nature", ratio: "portrait", tone: "cool", alt: "Sunlight through forest trees" },
  { id: "p20", title: "Custom brand shoot", category: "other", ratio: "square", tone: "neutral", alt: "Custom photography for a brand project" },
];

export const featuredPortfolioItems = portfolioItems.filter((p) => p.featured);
