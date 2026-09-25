export const colors = {
  // --- SnapFind Studio Luxury Color System ---
  // Warm Ivory & Creams (Canvas & Surfaces)
  ivory: "#FBF9F4",
  cream: "#F5EFEB",
  "cream-soft": "#FAF7F2",
  "surface-card": "#FFFFFF",
  "surface-hover": "#FAF7F2",
  "surface-inset": "#F2ECE2",

  // Deep Forest Green (Primary Brand & Core Action)
  forest: "#163E2B",
  "forest-hover": "#1E5139",
  "forest-dark": "#0E291C",
  "forest-light": "#236345",
  "forest-tint": "#EAF4EE",

  // Sage Green (Secondary & Active Nav Indicators)
  sage: "#4A6B56",
  "sage-light": "#7D9D89",
  "sage-soft": "#E2EDE0",
  "sage-border": "#C7D8C4",

  // Heritage Champagne Gold (Accent & Luxury Badges)
  champagne: "#C8A874",
  "champagne-light": "#E2CEAD",
  "champagne-soft": "#FAF4EB",
  "champagne-dark": "#8F6E3B",

  // Editorial Pastel Metric Accents (Direct from Reference Design)
  "metric-peach-bg": "#FCECDD",
  "metric-peach-text": "#9E5926",
  "metric-peach-border": "#F5D5BA",

  "metric-lavender-bg": "#EDE8F8",
  "metric-lavender-text": "#5B4C8A",
  "metric-lavender-border": "#D8CFEE",

  "metric-jade-bg": "#D9F2E6",
  "metric-jade-text": "#165B3B",
  "metric-jade-border": "#BEE5D3",

  "metric-amber-bg": "#FDF2DC",
  "metric-amber-text": "#96651E",
  "metric-amber-border": "#F8E0B5",

  // Typography (Organic Contrast - Deep Evergreen Charcoal)
  charcoal: "#152019",
  "charcoal-soft": "#2C3831",
  "warm-gray": "#556057",
  "warm-gray-light": "#7C867E",
  "warm-border": "#E8E2D5",
  "warm-border-light": "#F2ECE2",

  // Status & Alerts
  success: "#226B43",
  "success-bg": "#EAF5EE",
  "success-border": "#B5DEC6",

  warning: "#B87814",
  "warning-bg": "#FEF7EB",
  "warning-border": "#F6DBAE",

  danger: "#B83832",
  "danger-bg": "#FDF2F1",
  "danger-border": "#F4BFBC",

  info: "#2B5E7C",
  "info-bg": "#EBF3F8",
  "info-border": "#BED9E8",

  // Compatibility Mappings (Seamless transition from legacy tokens)
  base: "#FBF9F4",
  panel: "#FFFFFF",
  panel2: "#F5EFEB",
  hairline: "#E8E2D5",
  cloud: "#152019",
  dim: "#556057",
  violet: "#163E2B",
  "violet-light": "#4A6B56",
  good: "#226B43",
  bad: "#B83832",
} as const;

export type ColorToken = keyof typeof colors;
