export const colors = {
  // --- SnapFind Studio Luxury Color System ---
  // Warm Ivory & Creams
  ivory: "#FAF8F5",
  cream: "#F5F2EB",
  "cream-soft": "#F9F8F5",
  "surface-card": "#FFFFFF",
  "surface-hover": "#F8F6F1",

  // Deep Forest Green (Primary)
  forest: "#1E3A2F",
  "forest-hover": "#284D3E",
  "forest-dark": "#142820",
  "forest-tint": "#EDF3EF",

  // Sage Green (Secondary)
  sage: "#5F7D6B",
  "sage-light": "#8FA899",
  "sage-soft": "#EDF2EE",
  "sage-border": "#D5DFD8",

  // Champagne Gold (Accent)
  champagne: "#C5A880",
  "champagne-light": "#DFC9AF",
  "champagne-soft": "#FAF6F0",
  "champagne-dark": "#9A7E58",

  // Charcoal & Warm Grays (Typography)
  charcoal: "#1A1C1A",
  "charcoal-soft": "#2D312E",
  "warm-gray": "#636B66",
  "warm-gray-light": "#969D98",
  "warm-border": "#E7E3DC",
  "warm-border-light": "#F0EDE8",

  // Status & Alerts
  success: "#2D7A4F",
  "success-bg": "#EBF5EE",
  "success-border": "#BBE3C8",

  warning: "#C88719",
  "warning-bg": "#FEF7EB",
  "warning-border": "#F7DCB0",

  danger: "#C2413A",
  "danger-bg": "#FDF2F1",
  "danger-border": "#F5C2BF",

  info: "#3B6E8C",
  "info-bg": "#EDF4F8",
  "info-border": "#C6DDE9",

  // Compatibility Mappings (Seamless transition from legacy tokens)
  base: "#FAF8F5",
  panel: "#FFFFFF",
  panel2: "#F5F2EB",
  hairline: "#E7E3DC",
  cloud: "#1A1C1A",
  dim: "#636B66",
  violet: "#1E3A2F",
  "violet-light": "#5F7D6B",
  good: "#2D7A4F",
  bad: "#C2413A",
} as const;

export type ColorToken = keyof typeof colors;
